'use client';

import { useRef, useState } from 'react';
import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import riauAdm2 from '@/lib/geo/riau-adm2.json';
import { MAP_REGIONS } from '@/lib/data';
import type { District, DistrictDetail, StatusKey } from '@/lib/dashboard-types';
import StatusBadge from './status-badge';

const SVG_WIDTH = 880;
const SVG_HEIGHT = 480;

type RiauFeatureProperties = {
  id: string;
  name: string;
  geoName: string;
  shapeID: string;
};

type RiauFeature = GeoJSON.Feature<GeoJSON.Geometry, RiauFeatureProperties>;
type RiauFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, RiauFeatureProperties>;

type RenderedRegion = {
  id: string;
  name: string;
  geoName: string;
  d: string;
  label: [number, number];
};

const FILL: Record<string, string> = {
  green: 'var(--healthy)',
  amber: 'var(--monitor)',
  red: 'var(--risk)',
};

function fillFor(status: StatusKey | null) {
  return status ? FILL[status] : 'var(--border)';
}

function decisionLabelForStatus(status: StatusKey | null) {
  if (status === 'green') return 'Send now';
  if (status === 'amber') return 'Wait';
  if (status === 'red') return 'Do not send';
  return 'No active recommendation';
}

function statusHint(status: StatusKey | null, mode: 'simple' | 'terminal') {
  if (mode === 'simple') return decisionLabelForStatus(status);
  if (status === 'green') return 'Healthy — dispatch now';
  if (status === 'amber') return 'Monitor — hold this week';
  if (status === 'red') return 'At risk — hold';
  return 'No active recommendation';
}

const riauGeoJson = riauAdm2 as RiauFeatureCollection;
const projection = geoMercator().fitSize([SVG_WIDTH, SVG_HEIGHT], riauGeoJson);
const pathGenerator = geoPath(projection).digits(2);
const featuresByGeoName = new Map(riauGeoJson.features.map((feature) => [feature.properties.geoName, feature]));

function roundCoordinate(value: number) {
  return Number(value.toFixed(2));
}

const renderedRegions: RenderedRegion[] = MAP_REGIONS.flatMap((region) => {
  const feature = featuresByGeoName.get(region.geoName);
  if (!feature) return [];

  const centroid = projection(geoCentroid(feature as RiauFeature));
  const path = pathGenerator(feature as RiauFeature);
  if (!centroid || !path) return [];

  return [{
    ...region,
    d: path,
    label: [roundCoordinate(centroid[0]), roundCoordinate(centroid[1])],
  }];
});

interface Props {
  districts: District[];
  selected: string;
  setSelected: (id: string) => void;
  dateLabel?: string;
  detail?: DistrictDetail | null;
  mode?: 'simple' | 'terminal';
}

function metricValue(value: string | number | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return '—';
  return `${value}${suffix}`;
}

function formatRainProbability(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

export default function RiauMap({
  districts,
  selected,
  setSelected,
  dateLabel = 'Date unavailable',
  detail = null,
  mode = 'terminal',
}: Props) {
  const [hover, setHover] = useState<RenderedRegion | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const districtsById = new Map(districts.map((district) => [district.id, district]));
  const selectedDistrict = districts.find((district) => district.id === selected);
  const selectableDistrictIds = new Set(districts.map((district) => district.id));

  function onMove(e: React.MouseEvent, region: RenderedRegion) {
    const rect = wrapRef.current!.getBoundingClientRect();
    setTipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHover(region);
  }

  return (
    <div className="map-wrap" ref={wrapRef} onMouseLeave={() => setHover(null)}>
      <svg className="map-svg" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(15,26,31,0.04)" strokeWidth="2" />
          </pattern>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dy="1.5" result="o" />
            <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="880" height="480" fill="url(#hatch)" />

        <text x="820" y="60" textAnchor="end" fontSize="11" fill="rgba(15,26,31,0.35)" fontStyle="italic">Selat Malaka</text>
        <text x="60" y="450" fontSize="11" fill="rgba(15,26,31,0.35)" fontStyle="italic">Sumatera Barat →</text>

        <g filter="url(#softShadow)">
          {renderedRegions.map((region) => (
            <path
              key={region.id}
              d={region.d}
              className={`map-region${selected === region.id ? ' selected' : ''}${selectableDistrictIds.has(region.id) ? '' : ' inactive'}`}
              fill={fillFor(districtsById.get(region.id)?.status ?? null)}
              fillOpacity={districtsById.get(region.id)?.status ? 0.92 : 1}
              onMouseMove={(event) => onMove(event, region)}
              onClick={() => {
                if (selectableDistrictIds.has(region.id)) setSelected(region.id);
              }}
            />
          ))}
        </g>

        {renderedRegions.filter((region) => districtsById.get(region.id)?.status).map((region) => (
          <text
            key={`lbl-${region.id}`}
            x={region.label[0]}
            y={region.label[1]}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="600"
            fill="rgba(15,26,31,0.85)"
            style={{ pointerEvents: 'none', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {region.name}
          </text>
        ))}
        {renderedRegions.filter((region) => !districtsById.get(region.id)?.status).map((region) => (
          <text
            key={`lbl-${region.id}`}
            x={region.label[0]}
            y={region.label[1]}
            textAnchor="middle"
            fontSize="9"
            fontWeight="500"
            fill="rgba(15,26,31,0.55)"
            style={{ pointerEvents: 'none', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {region.name}
          </text>
        ))}

        <g transform="translate(820, 410)">
          <circle r="18" fill="var(--surface)" stroke="var(--border)" />
          <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="var(--ink)" />
          <text y="-22" textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">N</text>
        </g>
      </svg>

      {hover && (
        <div className="map-tooltip" style={{ left: tipPos.x, top: tipPos.y }}>
          <div>{hover.name}</div>
          <div className="tip-sub">{statusHint(districtsById.get(hover.id)?.status ?? null, mode)}</div>
        </div>
      )}

      <div className="legend">
        <h4>{mode === 'simple' ? `Dispatch map · ${dateLabel}` : `Crop health · ${dateLabel}`}</h4>
        <div className="legend-row"><span className="legend-swatch" style={{ background: 'var(--healthy)' }} />{mode === 'simple' ? 'Send now' : 'Healthy — dispatch now'}</div>
        <div className="legend-row"><span className="legend-swatch" style={{ background: 'var(--monitor)' }} />{mode === 'simple' ? 'Wait' : 'Moderate — monitor'}</div>
        <div className="legend-row"><span className="legend-swatch" style={{ background: 'var(--risk)' }} />{mode === 'simple' ? 'Do not send' : 'At risk — hold'}</div>
        <div className="legend-row" style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          <span className="legend-swatch" style={{ background: 'var(--border)' }} />No active recommendation
        </div>
      </div>

      {selectedDistrict && (
        <div className={`map-callout${mode === 'simple' ? ' simple' : ''}`}>
          {mode === 'simple' ? (
            <>
              <div className="callout-name-row">
                <div className="callout-name">{selectedDistrict.name}</div>
                <span className={`map-decision-pill ${selectedDistrict.status}`}>{detail?.decisionLabel ?? decisionLabelForStatus(selectedDistrict.status)}</span>
              </div>
              <div className="callout-sub">{detail?.reason ?? selectedDistrict.action}</div>
              <div className="callout-note">{detail?.riskNote ?? 'Review route and quality risk before sending trucks.'}</div>
              <div className="callout-row"><span>Rainfall risk</span><span className="callout-val mono">{formatRainProbability(detail?.rainfallProbability ?? null)}</span></div>
              <div className="callout-row"><span>Last updated</span><span className="callout-val mono">{metricValue(detail?.updatedAt ? dateLabel : selectedDistrict.updatedAt ? dateLabel : null)}</span></div>
            </>
          ) : (
            <>
              <div className="callout-name">
                {selectedDistrict.name}
                <StatusBadge status={selectedDistrict.status} />
              </div>
              <div className="callout-sub">{selectedDistrict.action}</div>
              <div className="callout-row"><span>NDVI</span><span className="callout-val mono">{metricValue(selectedDistrict.ndvi?.toFixed(2))}</span></div>
              <div className="callout-row"><span>CPO spot</span><span className="callout-val mono">{metricValue(selectedDistrict.cpo.toLocaleString('en-US'), ' IDR/kg')}</span></div>
              <div className="callout-row"><span>Last updated</span><span className="callout-val mono">{metricValue(selectedDistrict.updatedAt ? dateLabel : null)}</span></div>
              <div className="callout-row"><span>Confidence</span><span className="callout-val mono">{selectedDistrict.confidence}%</span></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
