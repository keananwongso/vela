'use client';

import { CPO_SERIES, type CpoPoint } from '@/lib/data';

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

function buildChart(series: CpoPoint[]) {
  const prices = series.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const yMin = Math.floor((minP - 80) / 100) * 100;
  const yMax = Math.ceil((maxP + 80) / 100) * 100;

  const xFn = (i: number) => PAD_L + (INNER_W * i) / (series.length - 1);
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
  for (let v = yMin; v <= yMax; v += 100) ticks.push(v);

  const last4Avg = prices.slice(-4).reduce((a, b) => a + b, 0) / 4;
  const current = series[series.length - 1];
  const prev = series[series.length - 2];
  const wowDelta = current.price - prev.price;
  const wowPct = (wowDelta / prev.price) * 100;
  const favorable = current.price >= last4Avg;

  return { xFn, yFn, linePath, areaPath, ticks, yMin, yMax, last4Avg, current, wowDelta, wowPct, favorable, slope, intercept, n };
}

export default function PriceChart({ series = CPO_SERIES }: { series?: CpoPoint[] }) {
  const { xFn, yFn, linePath, areaPath, ticks, last4Avg, current, wowDelta, wowPct, favorable, slope, intercept, n } = buildChart(series);

  return (
    <div className="chart-wrap">
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

      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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

        {series.map((p, i) => (
          <g key={p.week}>
            <circle
              cx={xFn(i)} cy={yFn(p.price)}
              r={p.current ? 5 : 3}
              fill="var(--surface)" stroke="var(--healthy)"
              strokeWidth={p.current ? 2.5 : 1.5}
            />
            {p.current && (
              <>
                <line
                  x1={xFn(i)} y1={PAD_T}
                  x2={xFn(i)} y2={PAD_T + INNER_H}
                  stroke="var(--healthy)" strokeOpacity="0.25" strokeDasharray="2 3"
                />
                <g transform={`translate(${xFn(i)},${yFn(p.price) - 14})`}>
                  <rect x="-32" y="-18" width="64" height="20" rx="4" fill="var(--ink)" />
                  <text textAnchor="middle" y="-4" fontSize="11" fill="var(--surface)" fontFamily="var(--font-mono)" fontWeight="500">
                    {fmt(p.price)}
                  </text>
                </g>
              </>
            )}
          </g>
        ))}

        {series.map((p, i) => (
          <text
            key={`x-${p.week}`}
            x={xFn(i)} y={H - 10}
            textAnchor="middle" fontSize="11"
            fill={p.current ? 'var(--ink)' : 'var(--muted)'}
            fontWeight={p.current ? 600 : 400}
          >
            {p.week}
          </text>
        ))}

        <g transform={`translate(${xFn(n - 1)},${H - 26})`}>
          <rect x="-20" y="0" width="40" height="14" rx="3" fill="var(--healthy)" />
          <text textAnchor="middle" y="10" fontSize="10" fill="var(--surface)" fontWeight="600" letterSpacing="0.06em">
            NOW
          </text>
        </g>
      </svg>
    </div>
  );
}
