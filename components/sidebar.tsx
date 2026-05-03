'use client';

import Link from 'next/link';
import { USER } from '@/lib/data';

type Tab = 'overview' | 'settings';

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.2" y="2.2" width="5" height="5" rx="0.8"/>
    <rect x="8.8" y="2.2" width="5" height="5" rx="0.8"/>
    <rect x="2.2" y="8.8" width="5" height="5" rx="0.8"/>
    <rect x="8.8" y="8.8" width="5" height="5" rx="0.8"/>
  </svg>
);

const CogIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.2"/>
    <path d="M8 1.5 L8 3 M8 13 L8 14.5 M1.5 8 L3 8 M13 8 L14.5 8 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M3.4 12.6 L4.5 11.5 M11.5 4.5 L12.6 3.4"/>
  </svg>
);

const NAV_ITEMS: { id: Tab; label: string; href: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', href: '/overview', icon: <GridIcon /> },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <CogIcon /> },
];

export default function Sidebar({ active }: { active: Tab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">V</div>
        <div className="wordmark">Vela</div>
        <div className="tag">v3.4</div>
      </div>

      <nav className="nav" style={{ marginTop: 10 }}>
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
