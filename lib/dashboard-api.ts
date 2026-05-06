import { CPO_RECENT_BACKFILL_SERIES, DISTRICTS } from '@/lib/data';
import type { DashboardSnapshot, District, OverviewMeta, PriceSnapshot, StatusKey } from '@/lib/dashboard-types';

type ApiRegionSummary = {
  id: string;
  name: string;
  status: StatusKey;
  action: string;
  ndvi: number | null;
  confidence: number | null;
  latestPrice: number | null;
  updatedAt: string | null;
};

type ApiRegionsResponse = {
  regions: ApiRegionSummary[];
  summary?: {
    province?: string;
    districtCount?: number;
    lastSync?: string | null;
  };
};

type ApiPricePoint = {
  timestamp: string;
  week: string;
  price: number;
};

type ApiPricesResponse = {
  commodity: string;
  province: string;
  unit: string;
  currentPrice: number;
  lastUpdated: string;
  series: ApiPricePoint[];
  ffbReference?: number | null;
};

function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return (configured || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonthDay(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(value);
}

function formatDayLabel(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(value);
}

function getRecentSeriesWindow(points: ApiPricePoint[]) {
  const enriched = points
    .map((point) => {
      const date = parseTimestamp(point.timestamp);
      return date ? { ...point, date } : null;
    })
    .filter((point): point is ApiPricePoint & { date: Date } => point !== null);

  if (!enriched.length) return points;

  const latest = enriched[enriched.length - 1].date.getTime();
  const cutoff = latest - (6 * 86400000);
  const recent = enriched.filter((point) => point.date.getTime() >= cutoff);

  return recent.length
    ? recent.map(({ date: _date, ...point }) => point)
    : points;
}

function getIsoWeek(date: Date) {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = normalized.getUTCDay() || 7;
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));
  return Math.ceil((((normalized.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getOverviewMeta(syncTimestamp: string | null | undefined): OverviewMeta {
  const syncDate = parseTimestamp(syncTimestamp);
  if (!syncDate) {
    return {
      syncTimestamp: null,
      weekLabel: 'Week --',
      dateRangeLabel: 'Date unavailable',
      dayLabel: 'Date unavailable',
    };
  }

  const isoDay = syncDate.getUTCDay() || 7;
  const rangeStart = new Date(syncDate);
  rangeStart.setUTCDate(syncDate.getUTCDate() - (isoDay - 1));
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setUTCDate(rangeStart.getUTCDate() + 6);

  return {
    syncTimestamp: syncTimestamp ?? null,
    weekLabel: `Week ${getIsoWeek(syncDate)}`,
    dateRangeLabel: `${formatMonthDay(rangeStart)} – ${formatMonthDay(rangeEnd)}, ${rangeEnd.getUTCFullYear()}`,
    dayLabel: formatDayLabel(syncDate),
  };
}

function getFallbackPrices(): PriceSnapshot {
  const latestPoint = CPO_RECENT_BACKFILL_SERIES[CPO_RECENT_BACKFILL_SERIES.length - 1];

  return {
    commodity: 'cpo',
    province: 'Riau',
    unit: 'IDR/kg',
    currentPrice: latestPoint.price,
    lastUpdated: latestPoint.timestamp ?? '2026-05-06T07:00:00Z',
    series: CPO_RECENT_BACKFILL_SERIES,
    ffbReference: 2480,
  };
}

function getFallbackSnapshot(): DashboardSnapshot {
  const meta = getOverviewMeta('2026-05-06T07:00:00Z');
  return {
    districts: DISTRICTS,
    prices: getFallbackPrices(),
    meta,
    source: 'mock',
  };
}

function normalizeConfidence(confidence: number | null | undefined, fallback: number) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return fallback;
  if (confidence <= 1) return Math.round(confidence * 100);
  return Math.round(confidence);
}

function buildPriceSnapshot(apiPrices?: ApiPricesResponse): PriceSnapshot {
  if (!apiPrices || !apiPrices.series.length) return getFallbackPrices();

  const recentSeries = getRecentSeriesWindow(apiPrices.series);
  const activeSeries = recentSeries.length >= 6
    ? recentSeries
    : CPO_RECENT_BACKFILL_SERIES.map((point) => ({
        timestamp: point.timestamp ?? '2026-05-06T07:00:00Z',
        week: point.week,
        price: point.price,
      }));
  const latestPoint = activeSeries[activeSeries.length - 1];

  return {
    commodity: apiPrices.commodity,
    province: apiPrices.province,
    unit: apiPrices.unit,
    currentPrice: latestPoint.price,
    lastUpdated: latestPoint.timestamp,
    series: activeSeries.map((point, index, points) => ({
      week: parseTimestamp(point.timestamp) ? formatDayLabel(parseTimestamp(point.timestamp) as Date) : point.week,
      price: point.price,
      timestamp: point.timestamp,
      current: index === points.length - 1,
    })),
    ffbReference: apiPrices.ffbReference ?? 2480,
  };
}

function buildDistricts(apiRegions: ApiRegionSummary[] | undefined, prices: PriceSnapshot): District[] {
  if (!apiRegions?.length) return DISTRICTS;

  const regionsById = new Map(apiRegions.map((region) => [region.id, region]));
  const last4Avg =
    prices.series.slice(-4).reduce((sum, point) => sum + point.price, 0) /
    Math.min(4, prices.series.length);

  return DISTRICTS.map((fallback) => {
    const region = regionsById.get(fallback.id);
    if (!region) return fallback;

    const cpo = region.latestPrice ?? prices.currentPrice ?? fallback.cpo;

    return {
      id: fallback.id,
      name: region.name,
      status: region.status,
      action: region.action,
      cpo,
      cpoNote: cpo >= last4Avg ? 'favorable' : 'caution',
      yield: null,
      ndvi: region.ndvi ?? fallback.ndvi,
      moisture: null,
      ffa: null,
      trucks: null,
      eta: null,
      confidence: normalizeConfidence(region.confidence, fallback.confidence),
      updatedAt: region.updatedAt ?? fallback.updatedAt,
    };
  });
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const fallback = getFallbackSnapshot();
  const [regionsResult, pricesResult] = await Promise.allSettled([
    fetchJson<ApiRegionsResponse>('/regions'),
    fetchJson<ApiPricesResponse>('/prices/cpo'),
  ]);

  const apiRegions = regionsResult.status === 'fulfilled' ? regionsResult.value.regions : undefined;
  const apiPrices = pricesResult.status === 'fulfilled' ? pricesResult.value : undefined;

  if (!apiRegions && !apiPrices) return fallback;

  const prices = buildPriceSnapshot(apiPrices);
  const districts = buildDistricts(apiRegions, prices);
  const syncTimestamp =
    (regionsResult.status === 'fulfilled' ? regionsResult.value.summary?.lastSync : undefined)
      ?? apiPrices?.lastUpdated
      ?? null;

  return {
    districts,
    prices,
    meta: getOverviewMeta(syncTimestamp),
    source: apiRegions && apiPrices ? 'api' : 'mixed',
  };
}

export function getFallbackDashboardSnapshot() {
  return getFallbackSnapshot();
}
