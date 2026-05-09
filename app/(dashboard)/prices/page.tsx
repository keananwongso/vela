'use client';

import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard-data-provider';
import PriceChart from '@/components/chart';
import { getPriceSeriesMeta } from '@/lib/price-window';

const CHART_TABS = ['4w', '8w'] as const;
const WEEKS_BY_TAB: Record<(typeof CHART_TABS)[number], number> = {
  '4w': 4,
  '8w': 8,
};

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function escapeCsvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function formatExportDate(value: string) {
  const date = new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(safeDate);
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
    timeZoneName: 'short',
  });
}

export default function PricesPage() {
  const [chartTab, setChartTab] = useState<(typeof CHART_TABS)[number]>('8w');
  const { prices } = useDashboardData();
  const series = prices.series;
  const priceSeriesMeta = getPriceSeriesMeta(series);

  const cur = series[series.length - 1];
  const referenceWindow = Math.min(priceSeriesMeta.referencePeriods, series.length);
  const referenceAvg = series.slice(-referenceWindow).reduce((s, p) => s + p.price, 0) / Math.max(referenceWindow, 1);
  const last8avg = series.reduce((s, p) => s + p.price, 0) / series.length;
  const weeksToShow = WEEKS_BY_TAB[chartTab];
  const visibleSeries = series.slice(-Math.min(weeksToShow, series.length));
  const showingAllAvailable = weeksToShow > series.length;

  function exportPriceSeries() {
    const snapshotRows: Array<Array<string | number>> = [
      ['Commodity', prices.commodity.toUpperCase()],
      ['Province', prices.province],
      ['Unit', prices.unit],
      ['Current price', `${fmt(cur.price)} ${prices.unit}`],
      ['Last updated', prices.lastUpdated],
      ['Reference average', `${fmt(Math.round(referenceAvg))} ${prices.unit}`],
      ['History window', priceSeriesMeta.historyLabel],
      ['Chart tab', chartTab],
      ['Showing all available data', showingAllAvailable ? 'yes' : 'no'],
      [],
      [priceSeriesMeta.periodLabel, `Price (${prices.unit})`, 'WoW change', 'WoW change (%)', 'Signal', 'Timestamp'],
      ...series.map((point, index) => {
        const previousPoint = index > 0 ? series[index - 1] : point;
        const delta = index > 0 ? point.price - previousPoint.price : 0;
        const pct = index > 0 ? (delta / previousPoint.price) * 100 : 0;
        const favorable = point.price >= referenceAvg;

        return [
          point.week,
          fmt(point.price),
          index === 0 ? '—' : `${delta >= 0 ? '+' : '-'}${fmt(Math.abs(delta))}`,
          index === 0 ? '—' : `${pct.toFixed(1)}%`,
          favorable ? 'Favorable' : 'Caution',
          point.timestamp ?? '—',
        ];
      }),
    ];
    const csv = snapshotRows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vela-prices-${formatExportDate(prices.lastUpdated)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">CPO spot · Dumai port</div>
          <h1 className="page-title">Prices</h1>
          <div className="page-sub">Live commodity feeds, weekly history, and trend analysis</div>
        </div>
        <div className="topbar-actions">
          <button className="btn" type="button" onClick={exportPriceSeries}>Export CSV</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">CPO spot · Dumai</div>
          <div className="val mono">{fmt(cur.price)}<span className="unit">IDR/kg</span></div>
          <div className="delta up">▲ favorable vs {priceSeriesMeta.averageLabelShort}</div>
        </div>
        <div className="kpi">
          <div className="label">{priceSeriesMeta.averageLabelLong}</div>
          <div className="val mono">{fmt(Math.round(referenceAvg))}<span className="unit">IDR/kg</span></div>
          <div className="delta flat">trailing window</div>
        </div>
        <div className="kpi">
          <div className="label">8-week average</div>
          <div className="val mono">{fmt(Math.round(last8avg))}<span className="unit">IDR/kg</span></div>
          <div className="delta up">▲ trending up</div>
        </div>
        <div className="kpi">
          <div className="label">FFB reference</div>
          <div className="val mono">{fmt(prices.ffbReference)}<span className="unit">IDR/kg</span></div>
          <div className="delta up">▲ 0.4% WoW</div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>CPO price trend · {chartTab}</h2>
            <div className="meta">
              Source: {prices.province} province live API feed
              {showingAllAvailable ? ' (showing all available data)' : ''}
            </div>
          </div>
          <div className="right">
            <div className="tabs">
              {CHART_TABS.map((t) => (
                <div key={t} className={`tab${chartTab === t ? ' active' : ''}`} onClick={() => setChartTab(t)}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
        <PriceChart series={visibleSeries} />
        <div className="foot">
          <span>Source: MongoDB Atlas via FastAPI</span>
          <span>Updated {formatUpdatedAt(prices.lastUpdated)}</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>{priceSeriesMeta.historyLabel}</h2>
            <div className="meta">CPO spot · IDR/kg</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{priceSeriesMeta.periodLabel}</th>
              <th>Price (IDR/kg)</th>
              <th>WoW change</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p, i) => {
              const prev = i > 0 ? series[i - 1].price : p.price;
              const delta = p.price - prev;
              const pct = i > 0 ? (delta / prev) * 100 : 0;
              const favorable = p.price >= referenceAvg;
              return (
                <tr key={p.week} className={p.current ? 'row-selected' : ''}>
                  <td style={{ fontWeight: p.current ? 600 : 500 }}>
                    {p.week}
                    {p.current && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--healthy)' }}>● now</span>
                    )}
                  </td>
                  <td className="mono">{fmt(p.price)}</td>
                  <td className="mono" style={{ color: delta >= 0 ? 'var(--healthy)' : 'var(--risk)' }}>
                    {i === 0 ? '—' : `${delta >= 0 ? '▲ +' : '▼ '}${fmt(Math.abs(delta))} (${pct.toFixed(1)}%)`}
                  </td>
                  <td>
                    <span className={`badge ${favorable ? 'green' : 'amber'}`}>
                      <span className="dot" />{favorable ? 'Favorable' : 'Caution'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
