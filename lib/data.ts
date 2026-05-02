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
  status: StatusKey | null;
  d: string;
  label: [number, number];
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
  {
    id: 'bengkalis', name: 'Bengkalis', status: null,
    d: 'M 470 70 L 560 60 L 640 80 L 700 110 L 720 150 L 690 175 L 640 178 L 590 165 L 540 150 L 495 130 Z',
    label: [600, 120],
  },
  {
    id: 'dumai', name: 'Dumai', status: null,
    d: 'M 380 95 L 470 70 L 495 130 L 470 160 L 410 158 L 375 135 Z',
    label: [430, 122],
  },
  {
    id: 'meranti', name: 'Meranti', status: null,
    d: 'M 700 110 L 780 105 L 815 135 L 800 170 L 745 175 L 720 150 Z',
    label: [755, 142],
  },
  {
    id: 'kuansing', name: 'Kuantan Singingi', status: null,
    d: 'M 230 320 L 320 305 L 360 335 L 350 385 L 290 410 L 230 395 L 200 360 Z',
    label: [285, 360],
  },
  {
    id: 'inhil', name: 'Indragiri Hilir', status: null,
    d: 'M 560 320 L 660 310 L 730 340 L 760 395 L 720 425 L 640 425 L 580 405 L 545 365 Z',
    label: [650, 372],
  },
  {
    id: 'pekanbaru', name: 'Pekanbaru', status: null,
    d: 'M 410 200 L 460 195 L 475 225 L 445 240 L 410 230 Z',
    label: [442, 218],
  },
  {
    id: 'rohul', name: 'Rokan Hulu', status: null,
    d: 'M 200 130 L 290 115 L 335 145 L 320 195 L 260 215 L 210 195 L 180 165 Z',
    label: [255, 165],
  },
  {
    id: 'rohil', name: 'Rokan Hilir', status: 'green',
    d: 'M 290 75 L 380 95 L 410 130 L 380 165 L 320 175 L 280 155 L 265 115 Z',
    label: [335, 125],
  },
  {
    id: 'siak', name: 'Siak', status: 'green',
    d: 'M 460 195 L 540 175 L 590 195 L 600 235 L 555 260 L 495 255 L 470 230 Z',
    label: [530, 218],
  },
  {
    id: 'kampar', name: 'Kampar', status: 'green',
    d: 'M 290 200 L 410 200 L 410 250 L 405 295 L 350 315 L 290 305 L 265 265 L 270 225 Z',
    label: [340, 250],
  },
  {
    id: 'pelalawan', name: 'Pelalawan', status: 'amber',
    d: 'M 405 250 L 495 255 L 555 260 L 580 290 L 565 330 L 500 340 L 430 325 L 405 295 Z',
    label: [495, 295],
  },
  {
    id: 'inhu', name: 'Indragiri Hulu', status: 'red',
    d: 'M 360 335 L 430 325 L 500 340 L 545 365 L 530 405 L 470 420 L 400 410 L 350 385 Z',
    label: [445, 372],
  },
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
