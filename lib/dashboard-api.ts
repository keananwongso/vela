import { CPO_RECENT_BACKFILL_SERIES, DISTRICTS } from '@/lib/data';
import type { DashboardFreshness, DashboardSnapshot, District, DistrictDetail, OverviewMeta, PriceSnapshot, StatusKey } from '@/lib/dashboard-types';

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
    latestRunId?: string | null;
    priceSyncTimestamp?: string | null;
    signalSyncTimestamp?: string | null;
    expectedRegionCount?: number;
    freshRegionCount?: number;
    freshRegionIds?: string[];
    staleRegionIds?: string[];
    isPartial?: boolean;
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

type ApiRegionLatestResponse = {
  region: {
    id: string;
    name: string;
  };
  recommendation: {
    cropHealth: string | null;
    status: StatusKey | null;
    action: string | null;
    priceSignal: string | null;
    confidence: number | null;
    generatedAt: string | null;
  };
  signals: {
    ndvi: number | null;
    rainfallProbability: number | null;
    temperatureMin: number | null;
    temperatureMax: number | null;
    windCondition: string | null;
    cpoPrice: number | null;
    ffbPrice: number | null;
  };
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

function formatDateKey(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
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

function getFallbackFreshness(): DashboardFreshness {
  return {
    latestRunId: null,
    priceSyncTimestamp: '2026-05-06T07:00:00Z',
    signalSyncTimestamp: '2026-05-06T07:00:00Z',
    expectedRegionCount: DISTRICTS.length,
    freshRegionCount: DISTRICTS.length,
    freshRegionIds: DISTRICTS.map((district) => district.id),
    staleRegionIds: [],
    isPartial: false,
  };
}

function getFallbackSnapshot(): DashboardSnapshot {
  const meta = getOverviewMeta('2026-05-06T07:00:00Z');
  return {
    districts: DISTRICTS,
    prices: getFallbackPrices(),
    meta,
    freshness: getFallbackFreshness(),
    source: 'mock',
  };
}

function normalizeConfidence(confidence: number | null | undefined, fallback: number) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return fallback;
  if (confidence <= 1) return Math.round(confidence * 100);
  return Math.round(confidence);
}

function normalizeOptionalConfidence(confidence: number | null | undefined, fallback: number | null = null) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return fallback;
  if (confidence <= 1) return Math.round(confidence * 100);
  return Math.round(confidence);
}

function decisionLabelForStatus(status: StatusKey) {
  if (status === 'green') return 'Send now';
  if (status === 'amber') return 'Wait';
  return 'Do not send';
}

function buildFallbackPriceSignal(district: District) {
  return district.cpoNote === 'favorable'
    ? 'CPO is above the recent average, so procurement pricing supports collection.'
    : 'CPO is soft versus the recent average, so be selective with procurement.';
}

function extractActionReason(action: string, status: StatusKey) {
  const parts = action.split(/\s+[—-]\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) return parts.slice(1).join('. ');
  if (status === 'green') return 'Crop conditions and route timing look workable this week.';
  if (status === 'amber') return 'Conditions are mixed, so it is safer to wait before assigning trucks.';
  return 'Field and route risk are too high for dispatch this week.';
}

function buildRiskNote(
  status: StatusKey,
  rainfallProbability: number | null,
  district: Pick<District, 'moisture' | 'ffa'>,
) {
  if (typeof rainfallProbability === 'number' && !Number.isNaN(rainfallProbability)) {
    const rainPct = Math.round(rainfallProbability * 100);

    if (status === 'green') {
      return rainPct >= 45
        ? `Rain risk is ${rainPct}%, so confirm road access before dispatch.`
        : `Rain risk is ${rainPct}%, which still leaves a workable pickup window.`;
    }

    if (status === 'amber') {
      return `Rain risk is ${rainPct}%, so sending trucks now could lead to delays or weaker intake quality.`;
    }

    return `Rain risk is ${rainPct}%, so dispatching here would likely waste fleet time this week.`;
  }

  if (status === 'amber' && district.moisture) {
    return `Moisture is already at ${district.moisture}, so waiting reduces the chance of weaker intake quality.`;
  }

  if (status === 'red' && district.ffa) {
    return `FFA is tracking around ${district.ffa}, so collecting now increases the risk of poor-quality intake.`;
  }

  if (status === 'green') return 'The main risk is a late weather change, so confirm the route before trucks leave.';
  if (status === 'amber') return 'Moving too early could create delays, uneven loading, or weaker fruit quality.';
  return 'Sending trucks now could tie up fleet capacity without enough good fruit to justify the trip.';
}

export function buildFallbackDistrictDetail(district: District): DistrictDetail {
  return {
    id: district.id,
    name: district.name,
    status: district.status,
    decisionLabel: decisionLabelForStatus(district.status),
    reason: extractActionReason(district.action, district.status),
    riskNote: buildRiskNote(district.status, null, district),
    priceSignal: buildFallbackPriceSignal(district),
    rainfallProbability: null,
    confidence: district.confidence,
    ndvi: district.ndvi,
    cpoPrice: district.cpo,
    updatedAt: district.updatedAt ?? null,
  };
}

function buildRegionLatestDetail(apiDetail: ApiRegionLatestResponse, fallbackDistrict?: District): DistrictDetail {
  const district = fallbackDistrict ?? DISTRICTS.find((candidate) => candidate.id === apiDetail.region.id);
  const fallback = district ? buildFallbackDistrictDetail(district) : null;
  const status = apiDetail.recommendation.status ?? district?.status ?? 'amber';

  return {
    id: apiDetail.region.id,
    name: apiDetail.region.name ?? district?.name ?? apiDetail.region.id,
    status,
    decisionLabel: decisionLabelForStatus(status),
    reason: extractActionReason(apiDetail.recommendation.action ?? district?.action ?? 'Hold this week', status),
    riskNote: buildRiskNote(status, apiDetail.signals.rainfallProbability, district ?? { moisture: null, ffa: null }),
    priceSignal: apiDetail.recommendation.priceSignal ?? fallback?.priceSignal ?? 'Price context is unavailable for this district.',
    rainfallProbability: apiDetail.signals.rainfallProbability,
    confidence: normalizeOptionalConfidence(apiDetail.recommendation.confidence, fallback?.confidence ?? null),
    ndvi: apiDetail.signals.ndvi ?? fallback?.ndvi ?? null,
    cpoPrice: apiDetail.signals.cpoPrice ?? fallback?.cpoPrice ?? null,
    updatedAt: apiDetail.recommendation.generatedAt ?? fallback?.updatedAt ?? null,
  };
}

function normalizeLivePricePoints(points: ApiPricePoint[]) {
  return points
    .map((point) => {
      const date = parseTimestamp(point.timestamp);
      if (!date || typeof point.price !== 'number' || Number.isNaN(point.price)) return null;

      return {
        timestamp: point.timestamp,
        week: point.week,
        price: point.price,
        date,
        dateKey: formatDateKey(date),
      };
    })
    .filter((point): point is ApiPricePoint & { date: Date; dateKey: string } => point !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function dedupePricePointsByDate(points: Array<ApiPricePoint & { date: Date; dateKey: string }>) {
  const pointsByDate = new Map<string, ApiPricePoint & { date: Date; dateKey: string }>();

  for (const point of points) {
    const current = pointsByDate.get(point.dateKey);
    if (!current || point.date.getTime() >= current.date.getTime()) {
      pointsByDate.set(point.dateKey, point);
    }
  }

  return [...pointsByDate.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildMergedRecentPriceSeries(livePoints: ApiPricePoint[]) {
  const recentLiveSeries = dedupePricePointsByDate(normalizeLivePricePoints(getRecentSeriesWindow(livePoints)));
  if (!recentLiveSeries.length) return [];

  if (recentLiveSeries.length >= CPO_RECENT_BACKFILL_SERIES.length) {
    return recentLiveSeries.map(({ date: _date, dateKey: _dateKey, ...point }) => point);
  }

  const fallbackSeries = CPO_RECENT_BACKFILL_SERIES
    .map((point) => {
      const date = parseTimestamp(point.timestamp);
      return date
        ? {
          timestamp: point.timestamp as string,
          week: point.week,
          price: point.price,
          date,
          dateKey: formatDateKey(date),
        }
        : null;
    })
    .filter((point): point is ApiPricePoint & { date: Date; dateKey: string } => point !== null);

  return dedupePricePointsByDate([...fallbackSeries, ...recentLiveSeries])
    .map(({ date: _date, dateKey: _dateKey, ...point }) => point);
}

function buildPriceSnapshot(apiPrices?: ApiPricesResponse): PriceSnapshot {
  if (!apiPrices || !apiPrices.series.length) return getFallbackPrices();
  const normalizedLiveSeries = normalizeLivePricePoints(apiPrices.series);
  if (!normalizedLiveSeries.length) return getFallbackPrices();

  const activeSeries = buildMergedRecentPriceSeries(apiPrices.series);
  if (!activeSeries.length) return getFallbackPrices();

  const latestLivePoint = normalizedLiveSeries[normalizedLiveSeries.length - 1];

  return {
    commodity: apiPrices.commodity,
    province: apiPrices.province,
    unit: apiPrices.unit,
    currentPrice: latestLivePoint.price,
    lastUpdated: apiPrices.lastUpdated ?? latestLivePoint.timestamp,
    series: activeSeries.map((point, index, points) => ({
      week: parseTimestamp(point.timestamp) ? formatDayLabel(parseTimestamp(point.timestamp) as Date) : point.week,
      price: point.price,
      timestamp: point.timestamp,
      current: index === points.length - 1,
    })),
    ffbReference: apiPrices.ffbReference ?? 2480,
  };
}

function buildFreshness(
  summary: ApiRegionsResponse['summary'] | undefined,
  fallback: DashboardFreshness,
  priceSyncTimestamp: string | null,
): DashboardFreshness {
  return {
    latestRunId: summary?.latestRunId ?? fallback.latestRunId,
    priceSyncTimestamp: summary?.priceSyncTimestamp ?? priceSyncTimestamp ?? fallback.priceSyncTimestamp,
    signalSyncTimestamp: summary?.signalSyncTimestamp ?? fallback.signalSyncTimestamp,
    expectedRegionCount: summary?.expectedRegionCount ?? summary?.districtCount ?? fallback.expectedRegionCount,
    freshRegionCount: summary?.freshRegionCount ?? fallback.freshRegionCount,
    freshRegionIds: summary?.freshRegionIds ?? fallback.freshRegionIds,
    staleRegionIds: summary?.staleRegionIds ?? fallback.staleRegionIds,
    isPartial: summary?.isPartial ?? fallback.isPartial,
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
      yield: fallback.yield,
      ndvi: region.ndvi ?? fallback.ndvi,
      moisture: fallback.moisture,
      ffa: fallback.ffa,
      trucks: fallback.trucks,
      eta: fallback.eta,
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
  const regionsSummary = regionsResult.status === 'fulfilled' ? regionsResult.value.summary : undefined;
  const syncTimestamp =
    regionsSummary?.lastSync
      ?? apiPrices?.lastUpdated
      ?? null;

  return {
    districts,
    prices,
    meta: getOverviewMeta(syncTimestamp),
    freshness: buildFreshness(regionsSummary, fallback.freshness, apiPrices?.lastUpdated ?? null),
    source: apiRegions && apiPrices ? 'api' : 'mixed',
  };
}

export function getFallbackDashboardSnapshot() {
  return getFallbackSnapshot();
}

export async function fetchRegionLatest(regionId: string, fallbackDistrict?: District): Promise<DistrictDetail> {
  const detail = await fetchJson<ApiRegionLatestResponse>(`/regions/${regionId}/latest`);
  return buildRegionLatestDetail(detail, fallbackDistrict);
}
