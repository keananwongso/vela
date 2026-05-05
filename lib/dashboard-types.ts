export type StatusKey = 'green' | 'amber' | 'red';

export type CpoNote = 'favorable' | 'caution';

export interface District {
  id: string;
  name: string;
  status: StatusKey;
  action: string;
  cpo: number;
  cpoNote: CpoNote;
  yield: string;
  ndvi: number;
  moisture: string;
  ffa: string;
  trucks: number;
  eta: string;
  confidence: number;
  updatedAt?: string;
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
  source: 'api' | 'mock' | 'mixed';
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
