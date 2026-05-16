import type { CpoPoint } from '@/lib/dashboard-types';

function hasTimestamp(value: string | undefined) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function getPriceSeriesMeta(series: CpoPoint[]) {
  const hasFullTimestamps = series.every((point) => hasTimestamp(point.timestamp));
  const isDailyWindow = hasFullTimestamps;
  const referencePeriods = isDailyWindow ? series.length : Math.min(4, series.length);

  return {
    isDailyWindow,
    referencePeriods,
    averageLabelLong: isDailyWindow ? `${referencePeriods}-day average` : '4-week average',
    averageLabelShort: isDailyWindow ? `${referencePeriods}-day avg` : '4-wk avg',
    referenceLineLabel: isDailyWindow ? `${referencePeriods}-day mean reference line` : '4-week mean reference line',
    historyLabel: isDailyWindow ? 'Daily history' : 'Weekly history',
    periodLabel: isDailyWindow ? 'Date' : 'Week',
  };
}
