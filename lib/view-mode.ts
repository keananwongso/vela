export type OverviewViewMode = 'simple' | 'terminal';

export const OVERVIEW_VIEW_STORAGE_KEY = 'vela:overview-view-mode';

export function isOverviewViewMode(value: string | null): value is OverviewViewMode {
  return value === 'simple' || value === 'terminal';
}
