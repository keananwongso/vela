export type StatusKey = 'green' | 'amber' | 'red';

export interface District {
  id: string;
  name: string;
  status: StatusKey;
  action: string;
  cpo: number;
  cpoNote: 'favorable' | 'caution';
  yield: string;
  ndvi: number;
  moisture: string;
  ffa: string;
  trucks: number;
  eta: string;
}

export interface CpoPoint {
  week: string;
  price: number;
  current?: boolean;
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

export const DISTRICTS: District[] = [
  {
    id: 'kampar',
    name: 'Kampar',
    status: 'green',
    action: 'Dispatch now — peak yield window',
    cpo: 12400,
    cpoNote: 'favorable',
    ndvi: 0.74,
    yield: '4.2 t/ha',
    moisture: '21%',
    ffa: '2.1%',
    trucks: 6,
    eta: '14 hrs',
  },
  {
    id: 'pelalawan',
    name: 'Pelalawan',
    status: 'amber',
    action: 'Hold this week — moisture rising',
    cpo: 12400,
    cpoNote: 'favorable',
    ndvi: 0.61,
    yield: '3.4 t/ha',
    moisture: '28%',
    ffa: '3.0%',
    trucks: 2,
    eta: '—',
  },
  {
    id: 'inhu',
    name: 'Indragiri Hulu',
    status: 'red',
    action: 'Prioritize Kampar instead',
    cpo: 12400,
    cpoNote: 'favorable',
    ndvi: 0.43,
    yield: '2.1 t/ha',
    moisture: '34%',
    ffa: '4.6%',
    trucks: 0,
    eta: '—',
  },
  {
    id: 'rohil',
    name: 'Rokan Hilir',
    status: 'green',
    action: 'Dispatch now — stable conditions',
    cpo: 12400,
    cpoNote: 'favorable',
    ndvi: 0.71,
    yield: '3.9 t/ha',
    moisture: '23%',
    ffa: '2.4%',
    trucks: 4,
    eta: '18 hrs',
  },
  {
    id: 'siak',
    name: 'Siak',
    status: 'green',
    action: 'Dispatch — clear weather window',
    cpo: 12400,
    cpoNote: 'favorable',
    ndvi: 0.68,
    yield: '4.0 t/ha',
    moisture: '22%',
    ffa: '2.2%',
    trucks: 3,
    eta: '12 hrs',
  },
];

export const CPO_SERIES: CpoPoint[] = [
  { week: 'Mar 03', price: 11820 },
  { week: 'Mar 10', price: 11950 },
  { week: 'Mar 17', price: 12080 },
  { week: 'Mar 24', price: 12010 },
  { week: 'Mar 31', price: 12130 },
  { week: 'Apr 07', price: 12270 },
  { week: 'Apr 14', price: 12310 },
  { week: 'Apr 21', price: 12400, current: true },
];

export const MAP_REGIONS: MapRegion[] = [
  { id: 'bengkalis', name: 'Bengkalis', geoName: 'Bengkalis' },
  { id: 'dumai', name: 'Dumai', geoName: 'Kota Dumai' },
  { id: 'inhil', name: 'Indragiri Hilir', geoName: 'Indragiri Hilir' },
  { id: 'inhu', name: 'Indragiri Hulu', geoName: 'Indragiri Hulu' },
  { id: 'kampar', name: 'Kampar', geoName: 'Kampar' },
  { id: 'meranti', name: 'Kepulauan Meranti', geoName: 'Kepulauan Meranti' },
  { id: 'kuansing', name: 'Kuantan Singingi', geoName: 'Kuantan Singingi' },
  { id: 'pelalawan', name: 'Pelalawan', geoName: 'Pelalawan' },
  { id: 'pekanbaru', name: 'Pekanbaru', geoName: 'Kota Pekanbaru' },
  { id: 'rohil', name: 'Rokan Hilir', geoName: 'Rokan Hilir' },
  { id: 'rohul', name: 'Rokan Hulu', geoName: 'Rokan Hulu' },
  { id: 'siak', name: 'Siak', geoName: 'Siak' },
];

export const MILL = {
  name: 'PT Sawit Riau',
  location: 'Pekanbaru',
  fleetCount: 14,
};

export const USER = {
  name: 'Budi Santoso',
  initials: 'BS',
  role: 'Procurement lead',
};
