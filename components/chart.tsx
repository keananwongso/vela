'use client';

import { useState } from 'react';
import type { CpoPoint } from '@/lib/dashboard-types';

const W = 920;
const H = 220;
const PAD_L = 56;
const PAD_R = 24;
const PAD_T = 16;
const PAD_B = 32;
const INNER_W = W - PAD_L - PAD_R;
const INNER_H = H - PAD_T - PAD_B;

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function niceStep(roughStep: number) {
  const exponent = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / exponent;

  if (fraction <= 1) return exponent;
  if (fraction <= 2) return 2 * exponent;
  if (fraction <= 5) return 5 * exponent;
  return 10 * exponent;
}

function buildChart(series: CpoPoint[]) {
  const prices = series.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const span = Math.max(maxP - minP, maxP * 0.05, 400);
  const yPadding = Math.max(span * 0.12, 120);
  const roughStep = (span + yPadding * 2) / 5;
  const step = niceStep(roughStep);
  const yMin = Math.floor((minP - yPadding) / step) * step;
  const yMax = Math.ceil((maxP + yPadding) / step) * step;

  const xFn = (i: number) => PAD_L + (INNER_W * i) / Math.max(series.length - 1, 1);
  const yFn = (v: number) => PAD_T + INNER_H * (1 - (v - yMin) / (yMax - yMin));

  const linePath = series
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFn(i)} ${yFn(p.price)}`)
    .join(' ');
  const areaPath = `${linePath} L ${xFn(series.length - 1)} ${PAD_T + INNER_H} L ${xFn(0)} ${PAD_T + INNER_H} Z`;

  // Linear regression trend
  const n = prices.length;
  const meanX = (n - 1) / 2;
  const meanY = prices.reduce((a, b) => a + b, 0) / n;
  const num = prices.reduce((s, p, i) => s + (i - meanX) * (p - meanY), 0);
  const den = prices.reduce((s, _, i) => s + (i - meanX) ** 2, 0);
  const slope = num / den;
  const intercept = meanY - slope * meanX;

  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += step) ticks.push(v);

  const last4Avg = prices.slice(-4).reduce((a, b) => a + b, 0) / 4;
  const current = series[series.length - 1];
  const prev = series[series.length - 2];
  const wowDelta = current.price - prev.price;
  const wowPct = (wowDelta / prev.price) * 100;
  const favorable = current.price >= last4Avg;

  return { xFn, yFn, linePath, areaPath, ticks, yMin, yMax, last4Avg, current, wowDelta, wowPct, favorable, slope, intercept, n };
}

export default function PriceChart({ series }: { series: CpoPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { xFn, yFn, linePath, areaPath, ticks, last4Avg, current, wowDelta, wowPct, favorable, slope, intercept, n } = buildChart(series);
  const activeIndex = hoveredIndex ?? (series.length - 1);
  const activePoint = series[activeIndex];
  const activeX = xFn(activeIndex);
  const activeY = yFn(activePoint.price);
  const tooltipWidth = 92;
  const tooltipX = Math.min(Math.max(activeX - tooltipWidth / 2, PAD_L), W - PAD_R - tooltipWidth);
  const tooltipY = Math.max(activeY - 36, PAD_T + 4);

  return (
    <div className="chart-wrap" onMouseLeave={() => setHoveredIndex(null)}>
      <div className="chart-head">
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            CPO spot · Dumai port
          </div>
          <div className="chart-stat">
            <div className="price">{fmt(current.price)}</div>
            <div className="unit">IDR/kg</div>
            <div className={`delta ${wowDelta >= 0 ? 'up' : 'down'}`}>
              {wowDelta >= 0 ? '▲' : '▼'} {fmt(Math.abs(wowDelta))} ({wowPct.toFixed(1)}%) WoW
            </div>
            <span className={`badge ${favorable ? 'green' : 'amber'}`} style={{ marginLeft: 6 }}>
              <span className="dot" />
              {favorable ? 'Favorable' : 'Caution'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            4-week average{' '}
            <span className="mono" style={{ color: 'var(--ink)' }}>{fmt(Math.round(last4Avg))}</span>
            {' '}· current is{' '}
            <span style={{ color: favorable ? 'var(--healthy)' : 'var(--monitor)', fontWeight: 500 }}>
              {favorable ? 'above' : 'below'}
            </span>
            {' '}the 4-week mean → {favorable ? 'good window to dispatch' : 'consider holding'}
          </div>
        </div>
        <div className="chart-legend">
          <div className="item">
            <span className="swatch" style={{ background: 'var(--healthy)', height: 2 }} />
            CPO price
          </div>
          <div className="item">
            <span className="swatch" style={{ background: 'transparent', borderTop: '1.5px dashed var(--muted)', height: 0, width: 14 }} />
            Trend
          </div>
          <div className="item">
            <span className="swatch" style={{ background: 'transparent', borderTop: '1px dashed var(--muted)', height: 0, width: 14 }} />
            4-wk avg
          </div>
        </div>
      </div>

      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--healthy)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="var(--healthy)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD_L} y1={yFn(v)} x2={W - PAD_R} y2={yFn(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD_L - 10} y={yFn(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">
              {fmt(v)}
            </text>
          </g>
        ))}

        <line
          x1={PAD_L} y1={yFn(last4Avg)}
          x2={W - PAD_R} y2={yFn(last4Avg)}
          stroke="var(--muted)" strokeWidth="1" strokeDasharray="2 4"
        />
        <text x={W - PAD_R - 4} y={yFn(last4Avg) - 5} textAnchor="end" fontSize="10.5" fill="var(--muted)">
          4-wk avg
        </text>

        <path d={areaPath} fill="url(#chartFill)" />
        <path d={linePath} fill="none" stroke="var(--healthy)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        <line
          x1={xFn(0)} y1={yFn(intercept)}
          x2={xFn(n - 1)} y2={yFn(intercept + slope * (n - 1))}
          stroke="var(--muted)" strokeWidth="1.25" strokeDasharray="4 4"
        />

        <line
          x1={activeX} y1={PAD_T}
          x2={activeX} y2={PAD_T + INNER_H}
          stroke="var(--healthy)" strokeOpacity="0.25" strokeDasharray="2 3"
        />

        {series.map((p, i) => (
          <g key={p.week}>
            <circle
              cx={xFn(i)} cy={yFn(p.price)}
              r={i === activeIndex ? 5 : 3}
              fill="var(--surface)" stroke="var(--healthy)"
              strokeWidth={i === activeIndex ? 2.5 : 1.5}
            />
            <circle
              cx={xFn(i)} cy={yFn(p.price)}
              r={12}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          </g>
        ))}

        <g transform={`translate(${tooltipX},${tooltipY})`} pointerEvents="none">
          <rect x="0" y="-18" width={tooltipWidth} height="24" rx="6" fill="var(--ink)" />
          <text x={tooltipWidth / 2} y="-2" textAnchor="middle" fontSize="11" fill="var(--surface)" fontFamily="var(--font-mono)" fontWeight="500">
            {fmt(activePoint.price)}
          </text>
        </g>

        {series.map((p, i) => (
          <text
            key={`x-${p.week}`}
            x={xFn(i)} y={H - 10}
            textAnchor="middle" fontSize="11"
            fill={i === activeIndex ? 'var(--ink)' : 'var(--muted)'}
            fontWeight={i === activeIndex ? 600 : 400}
          >
            {p.week}
          </text>
        ))}

        <g transform={`translate(${activeX},${H - 26})`}>
          <rect x="-20" y="0" width="40" height="14" rx="3" fill="var(--healthy)" />
          <text textAnchor="middle" y="10" fontSize="10" fill="var(--surface)" fontWeight="600" letterSpacing="0.06em">
            {hoveredIndex === null ? 'NOW' : activePoint.week}
          </text>
        </g>
      </svg>
    </div>
  );
}
