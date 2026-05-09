'use client';

import { useEffect, useRef, useState } from 'react';
import { useDashboardData } from '@/components/dashboard-data-provider';
import RiauMap from '@/components/riau-map';
import PriceChart from '@/components/chart';
import { buildFallbackDistrictDetail, fetchRegionLatest } from '@/lib/dashboard-api';
import type { District, DistrictDetail, StatusKey } from '@/lib/dashboard-types';
import { getPriceSeriesMeta } from '@/lib/price-window';
import { isOverviewViewMode, OVERVIEW_VIEW_STORAGE_KEY, type OverviewViewMode } from '@/lib/view-mode';

type StatusFilter = 'all' | 'green' | 'amber' | 'red';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'green', label: 'Send now' },
  { value: 'amber', label: 'Wait' },
  { value: 'red', label: 'Do not send' },
] as const satisfies ReadonlyArray<{ value: StatusFilter; label: string }>;

const STATUS_PRIORITY: Record<StatusKey, number> = {
  green: 0,
  amber: 1,
  red: 2,
};

const STATUS_COPY = {
  green: {
    boardLabel: 'Send now',
    terminalLabel: 'Dispatch',
    instruction: 'Allocate trucks to these districts first.',
    emptyState: 'No districts are ready for dispatch right now.',
    tone: 'green',
  },
  amber: {
    boardLabel: 'Wait',
    terminalLabel: 'Hold',
    instruction: 'Keep these districts on watch and review after the next update.',
    emptyState: 'No districts are in a wait state right now.',
    tone: 'amber',
  },
  red: {
    boardLabel: 'Do not send',
    terminalLabel: 'Avoid',
    instruction: 'Keep trucks out of these districts this week.',
    emptyState: 'No districts are flagged as avoid right now.',
    tone: 'red',
  },
} as const;

function formatSignalDateLabel(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

function parseTimeValue(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function metricOrUnavailable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'number' ? value.toString() : value;
}

function escapeCsvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function formatExportDate(value: string | undefined) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(safeDate);
}

function sortDistrictsForBoard(districts: District[]) {
  return [...districts].sort((a, b) => {
    const priorityDelta = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDelta !== 0) return priorityDelta;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.name.localeCompare(b.name);
  });
}

function buildPlanSummary(readyCount: number, waitCount: number, avoidCount: number) {
  if (!readyCount && !waitCount && !avoidCount) {
    return 'This week’s plan: no district recommendations are ready yet.';
  }

  return `This week’s plan: send to ${readyCount} districts, hold ${waitCount}, avoid ${avoidCount}.`;
}

function buildComparisonLabel(currentPrice: number, referenceAvg: number, averageLabel: string) {
  const delta = Math.round(currentPrice - referenceAvg);
  const direction = delta >= 0 ? 'Above' : 'Below';
  return `${direction} ${averageLabel} by ${Math.abs(delta).toLocaleString('en-US')} IDR/kg`;
}

function buildWhatToDo(detail: DistrictDetail) {
  if (detail.status === 'green') return `Send trucks to ${detail.name} this week.`;
  if (detail.status === 'amber') return `Wait on ${detail.name} for now and review after the next signal update.`;
  return `Do not send trucks to ${detail.name} this week.`;
}

function formatRainProbability(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function formatConfidence(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value}%`;
}

function formatNdvi(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—';
  return value.toFixed(2);
}

export default function OverviewPage() {
  const [selected, setSelected] = useState('kampar');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingDispatchFocus, setPendingDispatchFocus] = useState(false);
  const [viewMode, setViewMode] = useState<OverviewViewMode>('simple');
  const [detailCache, setDetailCache] = useState<Record<string, DistrictDetail>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const filterTrayRef = useRef<HTMLDivElement>(null);
  const dispatchPlanRef = useRef<HTMLElement>(null);
  const { districts, prices, source, meta } = useDashboardData();
  const priceSeriesMeta = getPriceSeriesMeta(prices.series);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OVERVIEW_VIEW_STORAGE_KEY);
      if (isOverviewViewMode(stored)) setViewMode(stored);
    } catch {
      // Local storage can be unavailable in private or restricted browser contexts.
    }
  }, []);

  const orderedDistricts = sortDistrictsForBoard(districts);
  const visibleDistricts = statusFilter === 'all'
    ? orderedDistricts
    : orderedDistricts.filter((district) => district.status === statusFilter);
  const selectedDistrict = visibleDistricts.find((district) => district.id === selected) ?? null;

  useEffect(() => {
    if (!visibleDistricts.length) {
      if (selected) setSelected('');
      return;
    }

    if (!visibleDistricts.some((district) => district.id === selected)) {
      setSelected(visibleDistricts[0].id);
    }
  }, [selected, visibleDistricts]);

  useEffect(() => {
    if (!isFilterOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!filterTrayRef.current?.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (!pendingDispatchFocus || viewMode !== 'simple') return;

    const frame = window.requestAnimationFrame(() => {
      const node = dispatchPlanRef.current;
      if (!node) return;
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      node.focus({ preventScroll: true });
      setPendingDispatchFocus(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingDispatchFocus, viewMode]);

  useEffect(() => {
    if (!selectedDistrict) return;

    const fallbackDetail = buildFallbackDistrictDetail(selectedDistrict);
    setDetailCache((current) => current[selectedDistrict.id]
      ? current
      : { ...current, [selectedDistrict.id]: fallbackDetail });
    setLoadingDetailId(selectedDistrict.id);

    let active = true;

    fetchRegionLatest(selectedDistrict.id, selectedDistrict)
      .then((detail) => {
        if (active) {
          setDetailCache((current) => ({ ...current, [selectedDistrict.id]: detail }));
        }
      })
      .catch(() => {
        if (active) {
          setDetailCache((current) => current[selectedDistrict.id]
            ? current
            : { ...current, [selectedDistrict.id]: fallbackDetail });
        }
      })
      .finally(() => {
        if (active) {
          setLoadingDetailId((current) => (current === selectedDistrict.id ? null : current));
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDistrict]);

  function updateViewMode(nextMode: OverviewViewMode) {
    setViewMode(nextMode);

    try {
      window.localStorage.setItem(OVERVIEW_VIEW_STORAGE_KEY, nextMode);
    } catch {
      // The toggle still works for the current session if persistence is blocked.
    }
  }

  const current = prices.series[prices.series.length - 1];
  const previous = prices.series[prices.series.length - 2] ?? current;
  const referenceWindow = Math.min(priceSeriesMeta.referencePeriods, prices.series.length);
  const referenceAvg = prices.series.slice(-referenceWindow).reduce((sum, point) => sum + point.price, 0) / Math.max(referenceWindow, 1);
  const priceDelta = current.price - previous.price;
  const overallCounts = districts.reduce<Record<StatusKey, number>>((acc, district) => {
    acc[district.status] = (acc[district.status] || 0) + 1;
    return acc;
  }, { green: 0, amber: 0, red: 0 });
  const visibleCounts = visibleDistricts.reduce<Record<StatusKey, number>>((acc, district) => {
    acc[district.status] = (acc[district.status] || 0) + 1;
    return acc;
  }, { green: 0, amber: 0, red: 0 });
  const averageConfidence = visibleDistricts.length
    ? Math.round(visibleDistricts.reduce((sum, district) => sum + district.confidence, 0) / visibleDistricts.length)
    : 0;
  const averageNdvi = visibleDistricts.length
    ? visibleDistricts.reduce((sum, district) => sum + (district.ndvi ?? 0), 0) / visibleDistricts.length
    : 0;
  const districtTraceLines = [...visibleDistricts]
    .sort((a, b) => {
      const aTime = parseTimeValue(a.updatedAt) ?? Number.NEGATIVE_INFINITY;
      const bTime = parseTimeValue(b.updatedAt) ?? Number.NEGATIVE_INFINITY;
      if (aTime !== bTime) return aTime - bTime;
      return a.name.localeCompare(b.name);
    })
    .map((district) => ({
      sortValue: parseTimeValue(district.updatedAt) ?? Number.NEGATIVE_INFINITY,
      time: formatSignalDateLabel(district.updatedAt, meta.dayLabel),
      text: `${district.name} ${district.action.toLowerCase()}. Confidence ${district.confidence}%.`,
    }));
  const priceTraceLine = {
    sortValue: parseTimeValue(meta.syncTimestamp ?? current.timestamp) ?? Number.NEGATIVE_INFINITY,
    time: formatSignalDateLabel(meta.syncTimestamp ?? current.timestamp, meta.dayLabel),
    text: `CPO ${current.price >= referenceAvg ? 'above' : 'below'} ${priceSeriesMeta.isDailyWindow ? `${priceSeriesMeta.referencePeriods}-day` : '4-week'} mean; procurement bias ${current.price >= referenceAvg ? 'favorable' : 'cautious'}.`,
  };
  const modelTraceLines = [...districtTraceLines, priceTraceLine].sort((a, b) => a.sortValue - b.sortValue);
  const selectedDetail = selectedDistrict
    ? detailCache[selectedDistrict.id] ?? buildFallbackDistrictDetail(selectedDistrict)
    : null;
  const simpleActionGroups = (['green', 'amber', 'red'] as const).map((status) => ({
    status,
    districts: visibleDistricts.filter((district) => district.status === status),
  }));
  const planSummary = buildPlanSummary(overallCounts.green, overallCounts.amber, overallCounts.red);
  const priceComparisonLabel = buildComparisonLabel(current.price, referenceAvg, priceSeriesMeta.averageLabelShort);
  const activeFilterLabel = FILTER_OPTIONS.find((option) => option.value === statusFilter)?.label ?? 'All';
  const lastSyncLabel = formatSignalDateLabel(meta.syncTimestamp ?? current.timestamp, meta.dayLabel);

  function applyStatusFilter(nextFilter: StatusFilter) {
    setStatusFilter(nextFilter);
    setIsFilterOpen(false);
  }

  function exportVisibleDistricts() {
    const snapshotRows: Array<Array<string | number>> = [
      ['Snapshot week', meta.weekLabel],
      ['Snapshot date range', meta.dateRangeLabel],
      ['Snapshot day', meta.dayLabel],
      ['Sync timestamp', meta.syncTimestamp ?? '—'],
      ['Data source', source],
      ['Current CPO', `${current.price.toLocaleString('en-US')} IDR/kg`],
      ['Filter', activeFilterLabel],
      [],
      ['District', 'Status', 'Action', 'Confidence', 'NDVI', 'Moisture', 'FFA', 'Trucks', 'ETA', 'CPO', 'Updated'],
      ...visibleDistricts.map((district) => [
        district.name,
        STATUS_COPY[district.status].boardLabel,
        district.action,
        `${district.confidence}%`,
        metricOrUnavailable(district.ndvi?.toFixed(2)),
        metricOrUnavailable(district.moisture),
        metricOrUnavailable(district.ffa),
        metricOrUnavailable(district.trucks),
        metricOrUnavailable(district.eta),
        `${district.cpo.toLocaleString('en-US')} IDR/kg`,
        district.updatedAt ?? '—',
      ]),
    ];
    const csv = snapshotRows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vela-overview-${formatExportDate(meta.syncTimestamp ?? current.timestamp)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function focusDispatchPlan() {
    const node = dispatchPlanRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    node.focus({ preventScroll: true });
  }

  function handleDispatchPlanClick() {
    const firstActionableDistrict = orderedDistricts.find((district) => district.status === 'green') ?? orderedDistricts[0];
    if (firstActionableDistrict) {
      setSelected(firstActionableDistrict.id);
    }

    if (viewMode === 'terminal') {
      setPendingDispatchFocus(true);
      updateViewMode('simple');
      return;
    }

    focusDispatchPlan();
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">Riau Province · {meta.dateRangeLabel}</div>
          <h1 className="page-title">Procurement overview</h1>
          <div className="page-sub">
            Dispatch decisions for {visibleDistricts.length} districts · {source === 'mock' ? 'mock fallback active' : 'API-backed snapshot'}
          </div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-action-row" ref={filterTrayRef}>
            <div className="toolbar-button-row">
              <button
                className={`btn${isFilterOpen ? ' active' : ''}`}
                type="button"
                aria-expanded={isFilterOpen}
                aria-controls="overview-filter-tray"
                onClick={() => setIsFilterOpen((open) => !open)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4 L13 4 M3 8 L13 8 M3 12 L13 12" />
                </svg>
                Filter
              </button>
              <button className="btn" type="button" onClick={exportVisibleDistricts}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 2 L8 11 M8 11 L4.5 7.5 M8 11 L11.5 7.5 M3 13.5 L13 13.5" />
                </svg>
                Export
              </button>
            </div>
            {isFilterOpen && (
              <div className="filter-tray" id="overview-filter-tray" role="group" aria-label="District status filter">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-chip${statusFilter === option.value ? ' active' : ''}`}
                    aria-pressed={statusFilter === option.value}
                    onClick={() => applyStatusFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
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
            <button className="btn primary" type="button" onClick={handleDispatchPlanClick}>
              <span className="dot" />
              Dispatch plan · {overallCounts.green} districts
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'simple' ? (
        <>
          <section className="simple-board" id="dispatch-plan-section" ref={dispatchPlanRef} tabIndex={-1}>
            <div className="simple-summary-card">
              <div className="simple-eyebrow">{meta.weekLabel} dispatch board</div>
              <h2>{planSummary}</h2>
              <p>Start with the send-now list, then review the waits and do-not-send districts before assigning trucks.</p>
              <div className="simple-summary-chips">
                <span><strong className="mono">{current.price.toLocaleString('en-US')}</strong> IDR/kg CPO spot</span>
                <span>{priceComparisonLabel}</span>
                <span>Last sync <strong className="mono">{lastSyncLabel}</strong></span>
                {statusFilter !== 'all' ? <span>Viewing <strong>{activeFilterLabel}</strong> only</span> : null}
              </div>
            </div>

            <div className="simple-action-groups">
              {simpleActionGroups.map(({ status, districts: statusDistricts }) => {
                const copy = STATUS_COPY[status];

                return (
                  <section key={status} className={`simple-action-group ${copy.tone}`}>
                    <div className="simple-group-head">
                      <div>
                        <div className="simple-group-label">{copy.boardLabel}</div>
                        <p>{copy.instruction}</p>
                      </div>
                      <div className="simple-group-count mono">{statusDistricts.length}</div>
                    </div>

                    <div className="simple-group-list">
                      {statusDistricts.length ? statusDistricts.map((district) => {
                        const preview = detailCache[district.id] ?? buildFallbackDistrictDetail(district);

                        return (
                          <button
                            key={district.id}
                            type="button"
                            className={`simple-district-row${selected === district.id ? ' selected' : ''}`}
                            onClick={() => setSelected(district.id)}
                          >
                            <div className="simple-district-row-head">
                              <div>
                                <div className="simple-district-name">{district.name}</div>
                                <div className="simple-district-reason">{preview.reason}</div>
                              </div>
                              <span className={`simple-status-pill ${district.status}`}>{copy.boardLabel}</span>
                            </div>
                            <div className="simple-district-row-meta">
                              <span>Confidence <strong className="mono">{formatConfidence(preview.confidence)}</strong></span>
                              <span>Updated <strong className="mono">{formatSignalDateLabel(preview.updatedAt ?? district.updatedAt, meta.dayLabel)}</strong></span>
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="simple-group-empty">{copy.emptyState}</div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <section className="section simple-detail-section">
            <div className="section-head">
              <div>
                <h2>District decision detail</h2>
                <div className="meta">Plain-language reason for the selected district, with the map as confirmation.</div>
              </div>
            </div>

            {selectedDistrict && selectedDetail ? (
              <div className="simple-detail-layout">
                <article className="simple-detail-card">
                  <div className="simple-detail-top">
                    <div>
                      <div className="simple-detail-eyebrow">Selected district</div>
                      <h3>{selectedDetail.name}</h3>
                    </div>
                    <span className={`simple-status-pill large ${selectedDetail.status}`}>{selectedDetail.decisionLabel}</span>
                  </div>

                  {loadingDetailId === selectedDistrict.id ? (
                    <div className="simple-detail-refresh">Refreshing latest field reason…</div>
                  ) : null}

                  <div className="simple-detail-stack">
                    <div className="simple-detail-block">
                      <span>What to do</span>
                      <p>{buildWhatToDo(selectedDetail)}</p>
                    </div>
                    <div className="simple-detail-block">
                      <span>Why</span>
                      <p>{selectedDetail.reason}</p>
                    </div>
                    <div className="simple-detail-block">
                      <span>What could go wrong</span>
                      <p>{selectedDetail.riskNote}</p>
                    </div>
                  </div>

                  <div className="simple-support-card">
                    <div className="simple-support-head">Supporting facts</div>
                    <div className="simple-support-note">{selectedDetail.priceSignal}</div>
                    <div className="simple-support-rows">
                      <div className="simple-support-row"><span>Confidence</span><strong className="mono">{formatConfidence(selectedDetail.confidence)}</strong></div>
                      <div className="simple-support-row"><span>NDVI</span><strong className="mono">{formatNdvi(selectedDetail.ndvi)}</strong></div>
                      <div className="simple-support-row"><span>CPO spot</span><strong className="mono">{selectedDetail.cpoPrice !== null ? `${selectedDetail.cpoPrice.toLocaleString('en-US')} IDR/kg` : '—'}</strong></div>
                      <div className="simple-support-row"><span>Rainfall risk</span><strong className="mono">{formatRainProbability(selectedDetail.rainfallProbability)}</strong></div>
                      <div className="simple-support-row"><span>Last updated</span><strong className="mono">{formatSignalDateLabel(selectedDetail.updatedAt ?? selectedDistrict.updatedAt, meta.dayLabel)}</strong></div>
                    </div>
                  </div>
                </article>

                <div className="simple-map-panel">
                  <RiauMap
                    districts={visibleDistricts}
                    selected={selected}
                    setSelected={setSelected}
                    dateLabel={meta.dayLabel}
                    detail={selectedDetail}
                    mode="simple"
                  />
                </div>
              </div>
            ) : (
              <div className="simple-empty-state">No districts match the current filter.</div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="terminal-shell">
            <div className="terminal-titlebar">
              <div>
                <span>VELA // RIAU PROCUREMENT TERMINAL</span>
                <strong>{meta.dayLabel.toUpperCase()} / LIVE SNAPSHOT</strong>
              </div>
              <div className="terminal-status">
                <span className="terminal-led" />
                SYNTHESIS ONLINE
              </div>
            </div>

            <div className="terminal-command">
              <span>VELA&gt;</span>
              <code>EXPLAIN DISPATCH /REGION=RIAU /DATE={meta.dayLabel.toUpperCase()} /CONFIDENCE={averageConfidence}%</code>
            </div>

            <div className="terminal-tape">
              <div><span>READY</span><strong className="mono">{visibleCounts.green || 0}/{visibleDistricts.length}</strong><em>+1 WoW</em></div>
              <div><span>CPO DUMAI</span><strong className="mono">{current.price.toLocaleString('en-US')}</strong><em>+{priceDelta.toLocaleString('en-US')}</em></div>
              <div><span>NDVI AVG</span><strong className="mono">{averageNdvi.toFixed(2)}</strong><em>{visibleDistricts.length} tracked districts</em></div>
              <div><span>LAST SYNC</span><strong className="mono">{metricOrUnavailable(meta.dayLabel)}</strong><em>{metricOrUnavailable(meta.syncTimestamp ? 'live API' : null)}</em></div>
              <div><span>RISK</span><strong className="mono">{visibleCounts.red || 0}</strong><em>district avoid</em></div>
            </div>

            <div className="terminal-grid">
              <div className="terminal-panel terminal-map-panel">
                <div className="terminal-panel-head">
                  <span>CHOROPLETH / CROP HEALTH</span>
                  <strong>NDVI + live recommendation status</strong>
                </div>
                <RiauMap districts={visibleDistricts} selected={selected} setSelected={setSelected} dateLabel={meta.dayLabel} />
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
                    {visibleDistricts.length ? visibleDistricts.map((district) => (
                      <tr key={district.id} onClick={() => setSelected(district.id)}>
                        <td>{district.name}</td>
                        <td><span className={`terminal-signal ${district.status}`}>{STATUS_COPY[district.status].terminalLabel}</span></td>
                        <td className="mono">{district.ndvi?.toFixed(2) ?? '—'}</td>
                        <td className="mono">{district.confidence}%</td>
                        <td className="mono">{district.updatedAt ? meta.dayLabel : '—'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="mono">No districts match the current filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="terminal-panel terminal-price-panel">
                <div className="terminal-panel-head">
                  <span>CPO PRICE TAPE</span>
                  <strong>{priceSeriesMeta.referenceLineLabel}</strong>
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
                    <p key={`${line.sortValue}-${line.text}`}><span>{line.time}</span> {line.text}</p>
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
