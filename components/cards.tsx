'use client';

import { DISTRICTS } from '@/lib/data';
import StatusBadge from './status-badge';

interface Props {
  selected: string;
  setSelected: (id: string) => void;
}

function fmtIDR(n: number) {
  return n.toLocaleString('en-US');
}

export default function RecommendationCards({ selected, setSelected }: Props) {
  return (
    <div className="cards-scroll">
      {DISTRICTS.map((d) => (
        <div
          key={d.id}
          className={`rec-card ${d.status}${selected === d.id ? ' selected' : ''}`}
          onClick={() => setSelected(d.id)}
        >
          <div className="stripe" />
          <div className="card-head">
            <div className="card-name">{d.name}</div>
            <StatusBadge status={d.status} />
          </div>

          <div className="card-action">
            <span className="verb">Recommended action</span>
            {d.action}
          </div>

          <div className="card-meta">
            <div className="mini">Yield<span className="num">{d.yield}</span></div>
            <div className="mini">Moisture<span className="num">{d.moisture}</span></div>
            <div className="mini">Trucks<span className="num">{d.trucks}</span></div>
          </div>

          <div className="card-price">
            <span>
              CPO <span className="mono">{fmtIDR(d.cpo)}</span>{' '}
              <span style={{ color: 'var(--muted)' }}>IDR/kg</span>
            </span>
            <span>
              {d.cpoNote === 'favorable' ? (
                <span style={{ color: 'var(--healthy)', fontFamily: 'inherit', fontSize: 11.5 }}>
                  <span style={{ fontSize: 8, verticalAlign: 'middle', marginRight: 4 }}>●</span>favorable
                </span>
              ) : (
                <span style={{ color: 'var(--monitor)', fontFamily: 'inherit', fontSize: 11.5 }}>
                  <span style={{ fontSize: 8, verticalAlign: 'middle', marginRight: 4 }}>●</span>caution
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
