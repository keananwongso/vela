'use client';

import { useEffect, useState } from 'react';
import { useDashboardData } from '@/components/dashboard-data-provider';
import { isOverviewViewMode, OVERVIEW_VIEW_STORAGE_KEY, type OverviewViewMode } from '@/lib/view-mode';
import RiauMap from '@/components/riau-map';
import PriceChart from '@/components/chart';

function formatDistrictList(names: string[]) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function sentenceCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatWeekCode(weekLabel: string) {
  return weekLabel.replace('Week ', 'W');
}

function formatSignalTimestamp(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });
}

function metricOrUnavailable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'number' ? value.toString() : value;
}

function buildWeeklyActionStatement(
  healthy: string[],
  monitor: string[],
  risk: string[],
) {

  const clauses = [
    healthy.length ? `dispatch to ${formatDistrictList(healthy)}` : null,
    monitor.length ? `hold ${formatDistrictList(monitor)}` : null,
    risk.length ? `avoid ${formatDistrictList(risk)}` : null,
  ].filter(Boolean) as string[];

  if (!clauses.length) return 'This week — no active dispatch changes.';

  return `This week — ${clauses.map((clause, index) => (index === 0 ? clause : sentenceCase(clause))).join('. ')}.`;
}

const STATUS_COPY = {
  green: { label: 'Dispatch', instruction: 'Send trucks', tone: 'green' },
  amber: { label: 'Hold', instruction: 'Wait for moisture to clear', tone: 'amber' },
  red: { label: 'Avoid', instruction: 'Do not allocate trucks', tone: 'red' },
} as const;

export default function OverviewPage() {
  const [selected, setSelected] = useState('kampar');
  const [viewMode, setViewMode] = useState<OverviewViewMode>('simple');
  const { districts, prices, source, meta } = useDashboardData();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OVERVIEW_VIEW_STORAGE_KEY);
      if (isOverviewViewMode(stored)) setViewMode(stored);
    } catch {
      // Local storage can be unavailable in private or restricted browser contexts.
    }
  }, []);

  useEffect(() => {
    if (districts.length && !districts.some((district) => district.id === selected)) {
      setSelected(districts[0].id);
    }
  }, [districts, selected]);

  function updateViewMode(nextMode: OverviewViewMode) {
    setViewMode(nextMode);

    try {
      window.localStorage.setItem(OVERVIEW_VIEW_STORAGE_KEY, nextMode);
    } catch {
      // The toggle still works for the current session if persistence is blocked.
    }
  }

  const counts = districts.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const current = prices.series[prices.series.length - 1];
  const previous = prices.series[prices.series.length - 2] ?? current;
  const last4Avg = prices.series.slice(-4).reduce((sum, point) => sum + point.price, 0) / Math.min(4, prices.series.length);
  const priceDelta = current.price - previous.price;
  const healthyDistricts = districts.filter((district) => district.status === 'green');
  const monitorDistricts = districts.filter((district) => district.status === 'amber');
  const riskDistricts = districts.filter((district) => district.status === 'red');
  const averageConfidence = districts.length
    ? Math.round(districts.reduce((sum, district) => sum + district.confidence, 0) / districts.length)
    : 0;
  const averageNdvi = districts.length
    ? districts.reduce((sum, district) => sum + (district.ndvi ?? 0), 0) / districts.length
    : 0;
  const modelTraceLines = [
    ...districts.slice(0, 4).map((district) => ({
      time: formatSignalTimestamp(district.updatedAt, '—'),
      text: `${district.name} ${district.action.toLowerCase()}. Confidence ${district.confidence}%.`,
    })),
    {
      time: formatSignalTimestamp(meta.syncTimestamp ?? current.timestamp, '—'),
      text: `CPO ${current.price >= last4Avg ? 'above' : 'below'} 4-week mean; procurement bias ${current.price >= last4Avg ? 'favorable' : 'cautious'}.`,
    },
  ];
  const weeklyActionStatement = buildWeeklyActionStatement(
    healthyDistricts.map((district) => district.name),
    monitorDistricts.map((district) => district.name),
    riskDistricts.map((district) => district.name),
  );
  const actionGroups = [
    {
      status: 'green',
      districts: healthyDistricts,
    },
    {
      status: 'amber',
      districts: monitorDistricts,
    },
    {
      status: 'red',
      districts: riskDistricts,
    },
  ] as const;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">Riau Province · {meta.weekLabel} · {meta.dateRangeLabel}</div>
          <h1 className="page-title">Procurement overview</h1>
          <div className="page-sub">
            Dispatch decisions for {districts.length} kecamatan · {source === 'mock' ? 'mock fallback active' : 'API-backed snapshot'}
          </div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-action-row">
            <button className="btn">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4 L13 4 M3 8 L13 8 M3 12 L13 12" />
              </svg>
              Filter
            </button>
            <button className="btn">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2 L8 11 M8 11 L4.5 7.5 M8 11 L11.5 7.5 M3 13.5 L13 13.5" />
              </svg>
              Export
            </button>
          </div>
          <div className="dispatch-control-stack">
            <div className="view-mode-control" aria-label="Overview view depth">
              <div className="view-toggle">
                {(['simple', 'terminal'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`view-toggle-option ${mode}${viewMode === mode ? ' active' : ''}`}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => updateViewMode(mode)}
                  >
                    {mode === 'simple' ? 'Simple' : 'Terminal'}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn primary">
              <span className="dot" />
              Dispatch plan · {healthyDistricts.length} districts
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'simple' ? (
        <>
          <section className="simple-decision">
            <div className="simple-action-hero">
              <div className="simple-eyebrow">{meta.weekLabel} decision brief</div>
              <p>{weeklyActionStatement}</p>
              <div className="simple-hero-meta">
                <span><strong className="mono">{healthyDistricts.length}</strong> districts ready</span>
                <span><strong className="mono">{current.price.toLocaleString('en-US')}</strong> IDR/kg CPO</span>
                <span><strong className="mono">{Math.round(last4Avg).toLocaleString('en-US')}</strong> 4-week avg</span>
              </div>
            </div>
            <div className="simple-action-grid">
              {actionGroups.map(({ status, districts }) => {
                const copy = STATUS_COPY[status];

                return (
                  <button
                    key={status}
                    type="button"
                    className={`simple-action-card ${copy.tone}`}
                    onClick={() => districts[0] && setSelected(districts[0].id)}
                  >
                    <span>{copy.label}</span>
                    <strong>
                      {districts.length
                        ? districts.map((district, i) => (
                            <span key={district.id}>
                              {i > 0 && ', '}
                              {district.name}
                              <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)', marginLeft: 5 }}>
                                · <span className="mono">{district.confidence}%</span>
                              </span>
                            </span>
                          ))
                        : 'None'}
                    </strong>
                    <small>{copy.instruction}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section simple-map-section">
            <div className="section-head">
              <div>
                <h2>Riau action map</h2>
                <div className="meta">Click a kecamatan for the field-level reason</div>
              </div>
            </div>
            <RiauMap districts={districts} selected={selected} setSelected={setSelected} />
          </section>
        </>
      ) : (
        <>
          <section className="terminal-shell">
            <div className="terminal-titlebar">
              <div>
                <span>VELA // RIAU PROCUREMENT TERMINAL</span>
                <strong>{meta.weekLabel.toUpperCase()} / {meta.dayLabel.toUpperCase()} / LIVE SNAPSHOT</strong>
              </div>
              <div className="terminal-status">
                <span className="terminal-led" />
                SYNTHESIS ONLINE
              </div>
            </div>

            <div className="terminal-command">
              <span>VELA&gt;</span>
              <code>EXPLAIN DISPATCH /REGION=RIAU /WINDOW={formatWeekCode(meta.weekLabel)} /CONFIDENCE={averageConfidence}%</code>
            </div>

            <div className="terminal-tape">
              <div><span>READY</span><strong className="mono">{counts.green || 0}/{districts.length}</strong><em>+1 WoW</em></div>
              <div><span>CPO DUMAI</span><strong className="mono">{current.price.toLocaleString('en-US')}</strong><em>+{priceDelta.toLocaleString('en-US')}</em></div>
              <div><span>NDVI AVG</span><strong className="mono">{averageNdvi.toFixed(2)}</strong><em>5 tracked districts</em></div>
              <div><span>LAST SYNC</span><strong className="mono">{metricOrUnavailable(meta.dayLabel)}</strong><em>{metricOrUnavailable(meta.syncTimestamp ? 'live API' : null)}</em></div>
              <div><span>RISK</span><strong className="mono">{counts.red || 0}</strong><em>district avoid</em></div>
            </div>

            <div className="terminal-grid">
              <div className="terminal-panel terminal-map-panel">
                <div className="terminal-panel-head">
                  <span>CHOROPLETH / CROP HEALTH</span>
                  <strong>NDVI + live recommendation status</strong>
                </div>
                <RiauMap districts={districts} selected={selected} setSelected={setSelected} dateLabel={meta.dayLabel} />
              </div>

              <div className="terminal-panel">
                <div className="terminal-panel-head">
                  <span>RECOMMENDATION MATRIX</span>
                  <strong>Ranked by dispatch confidence</strong>
                </div>
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th>Signal</th>
                      <th>NDVI</th>
                      <th>Confidence</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.map((district) => (
                      <tr key={district.id} onClick={() => setSelected(district.id)}>
                        <td>{district.name}</td>
                        <td><span className={`terminal-signal ${district.status}`}>{STATUS_COPY[district.status].label}</span></td>
                        <td className="mono">{district.ndvi?.toFixed(2) ?? '—'}</td>
                        <td className="mono">{district.confidence}%</td>
                        <td className="mono">{district.updatedAt ? meta.dayLabel : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="terminal-panel terminal-price-panel">
                <div className="terminal-panel-head">
                  <span>CPO PRICE TAPE</span>
                  <strong>4-week mean reference line</strong>
                </div>
                <PriceChart series={prices.series} />
              </div>

              <div className="terminal-panel">
                <div className="terminal-panel-head">
                  <span>MODEL TRACE</span>
                  <strong>Why the recommendation changed</strong>
                </div>
                <div className="terminal-feed">
                  {modelTraceLines.map((line) => (
                    <p key={`${line.time}-${line.text}`}><span>{line.time}</span> {line.text}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
