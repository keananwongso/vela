import { CPO_SERIES, DISTRICTS } from '@/lib/data';
import type { DashboardSnapshot, District, PriceSnapshot, StatusKey } from '@/lib/dashboard-types';

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

function getFallbackPrices(): PriceSnapshot {
  return {
    commodity: 'cpo',
    province: 'Riau',
    unit: 'IDR/kg',
    currentPrice: CPO_SERIES[CPO_SERIES.length - 1].price,
    lastUpdated: '2026-04-21T07:38:00Z',
    series: CPO_SERIES,
    ffbReference: 2480,
  };
}

function getFallbackSnapshot(): DashboardSnapshot {
  return {
    districts: DISTRICTS,
    prices: getFallbackPrices(),
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

  return {
    commodity: apiPrices.commodity,
    province: apiPrices.province,
    unit: apiPrices.unit,
    currentPrice: apiPrices.currentPrice,
    lastUpdated: apiPrices.lastUpdated,
    series: apiPrices.series.map((point, index, points) => ({
      week: point.week,
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
      ...fallback,
      name: region.name,
      status: region.status,
      action: region.action,
      ndvi: region.ndvi ?? fallback.ndvi,
      confidence: normalizeConfidence(region.confidence, fallback.confidence),
      cpo,
      cpoNote: cpo >= last4Avg ? 'favorable' : 'caution',
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

  return {
    districts,
    prices,
    source: apiRegions && apiPrices ? 'api' : 'mixed',
  };
}

export function getFallbackDashboardSnapshot() {
  return getFallbackSnapshot();
}
