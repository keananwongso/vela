'use client';

import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard-data-provider';
import type { District, StatusKey } from '@/lib/dashboard-types';
import StatusBadge from '@/components/status-badge';

type SortKey = 'status' | 'yield' | 'moisture' | 'ffa' | 'trucks';

const STATUS_ORDER: Record<StatusKey, number> = { green: 0, amber: 1, red: 2 };

function numericOrInfinity(value: string | number | null) {
  if (value === null) return Number.POSITIVE_INFINITY;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function sortDistricts(districts: District[], key: SortKey, asc: boolean) {
  return [...districts].sort((a, b) => {
    let diff = 0;
    if (key === 'status') diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    else if (key === 'yield') diff = numericOrInfinity(a.yield) - numericOrInfinity(b.yield);
    else if (key === 'moisture') diff = numericOrInfinity(a.moisture) - numericOrInfinity(b.moisture);
    else if (key === 'ffa') diff = numericOrInfinity(a.ffa) - numericOrInfinity(b.ffa);
    else if (key === 'trucks') diff = numericOrInfinity(a.trucks) - numericOrInfinity(b.trucks);
    return asc ? diff : -diff;
  });
}

function displayMetric(value: string | number | null) {
  return value === null ? '—' : value;
}

export default function DistrictsPage() {
  const [selected, setSelected] = useState('kampar');
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortAsc, setSortAsc] = useState(true);
  const { districts } = useDashboardData();

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc);
    else { setSortKey(k); setSortAsc(true); }
  }

  const sorted = sortDistricts(districts, sortKey, sortAsc);
  const dispatchCount = districts.filter((district) => district.status === 'green').length;
  const holdCount = districts.filter((district) => district.status === 'amber').length;
  const riskCount = districts.filter((district) => district.status === 'red').length;

  function SortArrow({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span>;
  }

  const th: React.CSSProperties = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">Riau Province · 5 named districts</div>
          <h1 className="page-title">Districts</h1>
          <div className="page-sub">Detailed crop, quality and dispatch metrics for every district</div>
        </div>
        <div className="topbar-actions">
          <button className="btn">Filter</button>
          <button className="btn">Export CSV</button>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>All districts · {districts.length} active</h2>
            <div className="meta">Sorted by recommended dispatch priority · click column to sort</div>
          </div>
          <div className="right">
            <span className="badge green"><span className="dot" />{dispatchCount} dispatch</span>
            <span className="badge amber"><span className="dot" />{holdCount} hold</span>
            <span className="badge red"><span className="dot" />{riskCount} at risk</span>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>District</th>
              <th style={th} onClick={() => handleSort('status')}>Status<SortArrow k="status" /></th>
              <th>NDVI</th>
              <th style={th} onClick={() => handleSort('yield')}>Yield<SortArrow k="yield" /></th>
              <th style={th} onClick={() => handleSort('moisture')}>Moisture<SortArrow k="moisture" /></th>
              <th style={th} onClick={() => handleSort('ffa')}>FFA<SortArrow k="ffa" /></th>
              <th style={th} onClick={() => handleSort('trucks')}>Trucks<SortArrow k="trucks" /></th>
              <th>ETA</th>
              <th>Recommended action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr
                key={d.id}
                className={selected === d.id ? 'row-selected' : ''}
                onClick={() => setSelected(d.id)}
              >
                <td>{d.name}</td>
                <td><StatusBadge status={d.status} /></td>
                <td className="mono">{d.ndvi?.toFixed(2) ?? '—'}</td>
                <td className="mono">{displayMetric(d.yield)}</td>
                <td className="mono">{displayMetric(d.moisture)}</td>
                <td className="mono">{displayMetric(d.ffa)}</td>
                <td className="mono">{displayMetric(d.trucks)}</td>
                <td className="mono" style={{ color: 'var(--muted)' }}>{displayMetric(d.eta)}</td>
                <td style={{ color: 'color-mix(in srgb, var(--ink) 84%, var(--surface))' }}>{d.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
