export type StatusKey = 'green' | 'amber' | 'red';

export type CpoNote = 'favorable' | 'caution';

export interface District {
  id: string;
  name: string;
  status: StatusKey;
  action: string;
  cpo: number;
  cpoNote: CpoNote;
  yield: string | null;
  ndvi: number | null;
  moisture: string | null;
  ffa: string | null;
  trucks: number | null;
  eta: string | null;
  confidence: number;
  updatedAt?: string;
}

export interface OverviewMeta {
  syncTimestamp: string | null;
  weekLabel: string;
  dateRangeLabel: string;
  dayLabel: string;
}

export interface CpoPoint {
  week: string;
  price: number;
  current?: boolean;
  timestamp?: string;
}

export interface PriceSnapshot {
  commodity: string;
  province: string;
  unit: string;
  currentPrice: number;
  lastUpdated: string;
  series: CpoPoint[];
  ffbReference: number;
}

export interface DashboardSnapshot {
  districts: District[];
  prices: PriceSnapshot;
  meta: OverviewMeta;
  source: 'api' | 'mock' | 'mixed';
}

export interface DistrictDetail {
  id: string;
  name: string;
  status: StatusKey;
  decisionLabel: string;
  reason: string;
  riskNote: string;
  priceSignal: string;
  rainfallProbability: number | null;
  confidence: number | null;
  ndvi: number | null;
  cpoPrice: number | null;
  updatedAt: string | null;
}

export interface MapRegion {
  id: string;
  name: string;
  geoName: string;
}

export const STATUS_LABELS: Record<StatusKey, string> = {
  green: 'Healthy',
  amber: 'Monitor',
  red: 'At risk',
};
