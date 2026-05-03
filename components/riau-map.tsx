'use client';

import { useState, useRef } from 'react';
import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import riauAdm2 from '@/lib/geo/riau-adm2.json';
import { MAP_REGIONS, DISTRICTS, type StatusKey } from '@/lib/data';
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
  status: StatusKey | null;
};

const FILL: Record<string, string> = {
  green: 'var(--healthy)',
  amber: 'var(--monitor)',
  red:   'var(--risk)',
};

function fillFor(status: StatusKey | null) {
  return status ? FILL[status] : 'var(--border)';
}

function statusHint(status: StatusKey | null) {
  if (status === 'green') return 'Healthy — dispatch now';
  if (status === 'amber') return 'Monitor — hold this week';
  if (status === 'red')   return 'At risk — hold';
  return 'No active recommendation';
}

const riauGeoJson = riauAdm2 as RiauFeatureCollection;
const projection = geoMercator().fitSize([SVG_WIDTH, SVG_HEIGHT], riauGeoJson);
const pathGenerator = geoPath(projection).digits(2);
const featuresByGeoName = new Map(riauGeoJson.features.map((feature) => [feature.properties.geoName, feature]));
const districtsById = new Map(DISTRICTS.map((district) => [district.id, district]));

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
    status: districtsById.get(region.id)?.status ?? null,
  }];
});

interface Props {
  selected: string;
  setSelected: (id: string) => void;
}

export default function RiauMap({ selected, setSelected }: Props) {
  const [hover, setHover] = useState<RenderedRegion | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedDistrict = DISTRICTS.find((d) => d.id === selected);
  const selectableDistrictIds = new Set(DISTRICTS.map((district) => district.id));

  function onMove(e: React.MouseEvent, r: RenderedRegion) {
    const rect = wrapRef.current!.getBoundingClientRect();
    setTipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHover(r);
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
        <text x="60"  y="450" fontSize="11" fill="rgba(15,26,31,0.35)" fontStyle="italic">Sumatera Barat →</text>

        <g filter="url(#softShadow)">
          {renderedRegions.map((r) => (
            <path
              key={r.id}
              d={r.d}
              className={`map-region${selected === r.id ? ' selected' : ''}${selectableDistrictIds.has(r.id) ? '' : ' inactive'}`}
              fill={fillFor(r.status)}
              fillOpacity={r.status ? 0.92 : 1}
              onMouseMove={(e) => onMove(e, r)}
              onClick={() => {
                if (selectableDistrictIds.has(r.id)) setSelected(r.id);
              }}
            />
          ))}
        </g>

        {renderedRegions.filter((r) => r.status).map((r) => (
          <text
            key={`lbl-${r.id}`}
            x={r.label[0]} y={r.label[1]}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="600"
            fill="rgba(15,26,31,0.85)"
            style={{ pointerEvents: 'none', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {r.name}
          </text>
        ))}
        {renderedRegions.filter((r) => !r.status).map((r) => (
          <text
            key={`lbl-${r.id}`}
            x={r.label[0]} y={r.label[1]}
            textAnchor="middle"
            fontSize="9"
            fontWeight="500"
            fill="rgba(15,26,31,0.55)"
            style={{ pointerEvents: 'none', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {r.name}
          </text>
        ))}

        <g transform="translate(820, 410)">
          <circle r="18" fill="var(--surface)" stroke="var(--border)" />
          <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="var(--ink)" />
          <text y="-22" textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">N</text>
        </g>
      </svg>

      {hover && (
        <div
          className="map-tooltip"
          style={{ left: tipPos.x, top: tipPos.y }}
        >
          <div>{hover.name}</div>
          <div className="tip-sub">{statusHint(hover.status)}</div>
        </div>
      )}

      <div className="legend">
        <h4>Crop health · Apr 21</h4>
        <div className="legend-row"><span className="legend-swatch" style={{ background: 'var(--healthy)' }} />Healthy — dispatch now</div>
        <div className="legend-row"><span className="legend-swatch" style={{ background: 'var(--monitor)' }} />Moderate — monitor</div>
        <div className="legend-row"><span className="legend-swatch" style={{ background: 'var(--risk)' }} />At risk — hold</div>
        <div className="legend-row" style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          <span className="legend-swatch" style={{ background: 'var(--border)' }} />No active recommendation
        </div>
      </div>

      {selectedDistrict && (
        <div className="map-callout">
          <div className="callout-name">
            {selectedDistrict.name}
            <StatusBadge status={selectedDistrict.status} />
          </div>
          <div className="callout-sub">{selectedDistrict.action}</div>
          <div className="callout-row"><span>Yield (forecast)</span><span className="callout-val mono">{selectedDistrict.yield}</span></div>
          <div className="callout-row"><span>Moisture</span><span className="callout-val mono">{selectedDistrict.moisture}</span></div>
          <div className="callout-row"><span>Free fatty acid</span><span className="callout-val mono">{selectedDistrict.ffa}</span></div>
          <div className="callout-row"><span>Trucks staged</span><span className="callout-val mono">{selectedDistrict.trucks}</span></div>
        </div>
      )}
    </div>
  );
}
