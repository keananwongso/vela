'use client';

import Link from 'next/link';
import { MILL, USER } from '@/lib/data';

type Tab = 'overview' | 'districts' | 'prices' | 'settings';

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.2" y="2.2" width="5" height="5" rx="0.8"/>
    <rect x="8.8" y="2.2" width="5" height="5" rx="0.8"/>
    <rect x="2.2" y="8.8" width="5" height="5" rx="0.8"/>
    <rect x="8.8" y="8.8" width="5" height="5" rx="0.8"/>
  </svg>
);

const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4 L6 2.5 L10 4 L14 2.5 L14 12 L10 13.5 L6 12 L2 13.5 Z"/>
    <path d="M6 2.5 L6 12"/>
    <path d="M10 4 L10 13.5"/>
  </svg>
);

const TrendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12 L6 7.5 L9 10 L14 4"/>
    <path d="M14 4 L10.5 4 M14 4 L14 7.5"/>
  </svg>
);

const CogIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.2"/>
    <path d="M8 1.5 L8 3 M8 13 L8 14.5 M1.5 8 L3 8 M13 8 L14.5 8 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M3.4 12.6 L4.5 11.5 M11.5 4.5 L12.6 3.4"/>
  </svg>
);

const MillIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 13 L2.5 7 L8 3.5 L13.5 7 L13.5 13 Z"/>
    <path d="M6 13 L6 9.5 L10 9.5 L10 13"/>
  </svg>
);

const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="8" height="6" rx="0.6"/>
    <path d="M10 7 L13 7 L14 9 L14 11 L10 11"/>
    <circle cx="5" cy="12" r="1.2"/>
    <circle cx="12" cy="12" r="1.2"/>
  </svg>
);

const NAV_ITEMS: { id: Tab; label: string; href: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Overview',  href: '/overview',  icon: <GridIcon /> },
  { id: 'districts', label: 'Districts', href: '/districts', icon: <MapIcon /> },
  { id: 'prices',    label: 'Prices',    href: '/prices',    icon: <TrendIcon /> },
  { id: 'settings',  label: 'Settings',  href: '/settings',  icon: <CogIcon /> },
];

export default function Sidebar({ active }: { active: Tab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">V</div>
        <div className="wordmark">Vela</div>
        <div className="tag">v3.4</div>
      </div>

      <div className="sidebar-section">Workspace</div>
      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`nav-item${active === item.id ? ' active' : ''}`}
          >
            <span className="nav-active-bar" />
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-section">Mill</div>
      <nav className="nav">
        <div className="nav-item">
          <span className="icon"><MillIcon /></span>
          <span>{MILL.name}</span>
        </div>
        <div className="nav-item">
          <span className="icon"><TruckIcon /></span>
          <span>Fleet</span>
          <span className="count">{MILL.fleetCount}</span>
        </div>
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <div className="avatar">{USER.initials}</div>
          <div>
            <div className="name">{USER.name}</div>
            <div className="role">{USER.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
