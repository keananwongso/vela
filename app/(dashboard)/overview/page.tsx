'use client';

import { useEffect, useState } from 'react';
import { DISTRICTS, CPO_SERIES } from '@/lib/data';
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

function buildWeeklyActionStatement() {
  const healthy = DISTRICTS.filter((district) => district.status === 'green').map((district) => district.name);
  const monitor = DISTRICTS.filter((district) => district.status === 'amber').map((district) => district.name);
  const risk = DISTRICTS.filter((district) => district.status === 'red').map((district) => district.name);

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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OVERVIEW_VIEW_STORAGE_KEY);
      if (isOverviewViewMode(stored)) setViewMode(stored);
    } catch {
      // Local storage can be unavailable in private or restricted browser contexts.
    }
  }, []);

  function updateViewMode(nextMode: OverviewViewMode) {
    setViewMode(nextMode);

    try {
      window.localStorage.setItem(OVERVIEW_VIEW_STORAGE_KEY, nextMode);
    } catch {
      // The toggle still works for the current session if persistence is blocked.
    }
  }

  const counts = DISTRICTS.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const current = CPO_SERIES[CPO_SERIES.length - 1];
  const previous = CPO_SERIES[CPO_SERIES.length - 2];
  const last4Avg = CPO_SERIES.slice(-4).reduce((sum, point) => sum + point.price, 0) / 4;
  const priceDelta = current.price - previous.price;
  const totalTrucks = DISTRICTS.reduce((sum, district) => sum + district.trucks, 0);
  const weeklyActionStatement = buildWeeklyActionStatement();
  const actionGroups = [
    {
      status: 'green',
      districts: DISTRICTS.filter((district) => district.status === 'green'),
    },
    {
      status: 'amber',
      districts: DISTRICTS.filter((district) => district.status === 'amber'),
    },
    {
      status: 'red',
      districts: DISTRICTS.filter((district) => district.status === 'red'),
    },
  ] as const;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">Riau Province · Week 17 · Apr 15 – Apr 21, 2026</div>
          <h1 className="page-title">Procurement overview</h1>
          <div className="page-sub">Dispatch decisions for 5 kecamatan · last sync 14 minutes ago</div>
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
              Dispatch plan · 13 trucks
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'simple' ? (
        <>
          <section className="simple-decision">
            <div className="simple-action-hero">
              <div className="simple-eyebrow">Week 17 decision brief</div>
              <p>{weeklyActionStatement}</p>
              <div className="simple-hero-meta">
                <span><strong className="mono">{totalTrucks}</strong> trucks staged</span>
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
                    <strong>{districts.length ? formatDistrictList(districts.map((district) => district.name)) : 'None'}</strong>
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
            <RiauMap selected={selected} setSelected={setSelected} />
          </section>
        </>
      ) : (
        <>
          <section className="terminal-shell">
            <div className="terminal-titlebar">
              <div>
                <span>VELA // RIAU PROCUREMENT TERMINAL</span>
                <strong>WEEK 17 / APR 21 / MOCK DATA</strong>
              </div>
              <div className="terminal-status">
                <span className="terminal-led" />
                SYNTHESIS ONLINE
              </div>
            </div>

            <div className="terminal-command">
              <span>VELA&gt;</span>
              <code>EXPLAIN DISPATCH /REGION=RIAU /WINDOW=W17 /CONFIDENCE=0.86</code>
            </div>

            <div className="terminal-tape">
              <div><span>READY</span><strong className="mono">{counts.green || 0}/{DISTRICTS.length}</strong><em>+1 WoW</em></div>
              <div><span>CPO DUMAI</span><strong className="mono">{current.price.toLocaleString('en-US')}</strong><em>+{priceDelta.toLocaleString('en-US')}</em></div>
              <div><span>INTAKE</span><strong className="mono">2,840</strong><em>tonnes FFB</em></div>
              <div><span>FLEET</span><strong className="mono">78%</strong><em>{totalTrucks} staged</em></div>
              <div><span>RISK</span><strong className="mono">{counts.red || 0}</strong><em>district avoid</em></div>
            </div>

            <div className="terminal-grid">
              <div className="terminal-panel terminal-map-panel">
                <div className="terminal-panel-head">
                  <span>CHOROPLETH / CROP HEALTH</span>
                  <strong>NDVI + moisture + FFA</strong>
                </div>
                <RiauMap selected={selected} setSelected={setSelected} />
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
                      <th>Moisture</th>
                      <th>Trucks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISTRICTS.map((district) => (
                      <tr key={district.id} onClick={() => setSelected(district.id)}>
                        <td>{district.name}</td>
                        <td><span className={`terminal-signal ${district.status}`}>{STATUS_COPY[district.status].label}</span></td>
                        <td className="mono">{district.ndvi.toFixed(2)}</td>
                        <td className="mono">{district.moisture}</td>
                        <td className="mono">{district.trucks}</td>
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
                <PriceChart />
              </div>

              <div className="terminal-panel">
                <div className="terminal-panel-head">
                  <span>MODEL TRACE</span>
                  <strong>Why the recommendation changed</strong>
                </div>
                <div className="terminal-feed">
                  <p><span>09:00</span> Kampar yield window open; FFA below penalty threshold.</p>
                  <p><span>09:04</span> Rokan Hilir route window clear for <strong className="mono">18 hrs</strong>.</p>
                  <p><span>09:08</span> Pelalawan moisture rising; hold pending next weather pass.</p>
                  <p><span>09:11</span> Indragiri Hulu risk elevated; avoid truck allocation this week.</p>
                  <p><span>09:14</span> CPO above 4-week mean; procurement bias remains favorable.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
