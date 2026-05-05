'use client';

import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard-data-provider';
import PriceChart from '@/components/chart';

const CHART_TABS = ['4w', '8w', '26w', '52w'] as const;
const WEEKS_BY_TAB: Record<(typeof CHART_TABS)[number], number> = {
  '4w': 4,
  '8w': 8,
  '26w': 26,
  '52w': 52,
};

function fmt(n: number) {
  return n.toLocaleString('en-US');
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

  const cur = series[series.length - 1];
  const last4 = series.slice(-4).reduce((s, p) => s + p.price, 0) / Math.min(4, series.length);
  const last8avg = series.reduce((s, p) => s + p.price, 0) / series.length;
  const weeksToShow = WEEKS_BY_TAB[chartTab];
  const visibleSeries = series.slice(-Math.min(weeksToShow, series.length));
  const showingAllAvailable = weeksToShow > series.length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">CPO spot · Dumai port</div>
          <h1 className="page-title">Prices</h1>
          <div className="page-sub">Live commodity feeds, weekly history, and trend analysis</div>
        </div>
        <div className="topbar-actions">
          <button className="btn">Export CSV</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">CPO spot · Dumai</div>
          <div className="val mono">{fmt(cur.price)}<span className="unit">IDR/kg</span></div>
          <div className="delta up">▲ favorable vs 4-wk avg</div>
        </div>
        <div className="kpi">
          <div className="label">4-week average</div>
          <div className="val mono">{fmt(Math.round(last4))}<span className="unit">IDR/kg</span></div>
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
              Source: {prices.province} province seeded API feed
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
            <h2>Weekly history</h2>
            <div className="meta">CPO spot · IDR/kg</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Week</th>
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
              const favorable = p.price >= last4;
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
