'use client';

import { useEffect, useState } from 'react';
import { useDashboardData } from '@/components/dashboard-data-provider';
import { isOverviewViewMode, OVERVIEW_VIEW_STORAGE_KEY, type OverviewViewMode } from '@/lib/view-mode';

export default function SettingsPage() {
  const [defaultView, setDefaultView] = useState<OverviewViewMode>('simple');
  const { districts } = useDashboardData();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OVERVIEW_VIEW_STORAGE_KEY);
      if (isOverviewViewMode(stored)) setDefaultView(stored);
    } catch {
      // Keep the default select usable even if persistence is blocked.
    }
  }, []);

  function updateDefaultView(nextView: OverviewViewMode) {
    setDefaultView(nextView);

    try {
      window.localStorage.setItem(OVERVIEW_VIEW_STORAGE_KEY, nextView);
    } catch {
      // The visible preference still updates for this session if storage is blocked.
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">Workspace</div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Thresholds, sync cadence and notifications for procurement</div>
        </div>
      </div>

      <section className="section">
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, lineHeight: 1.05 }}>
            Procurement preferences
          </h2>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Applies to all dispatch recommendations for PT Sawit Riau
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label">Region selector</div>
          <div>
            <select className="settings-control" defaultValue="kampar">
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <div className="settings-help">Visible on Overview map</div>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label">Default view</div>
          <div>
            <select
              className="settings-control"
              value={defaultView}
              onChange={(event) => updateDefaultView(event.target.value as OverviewViewMode)}
            >
              <option value="simple">Simple</option>
              <option value="terminal">Terminal</option>
            </select>
            <div className="settings-help">Used when opening the Overview tab</div>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label">Sync cadence</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Daily · every day 18:00 WIB</div>
            <div className="settings-help">Satellite NDVI + weather + spot price feeds</div>
          </div>
        </div>

        <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn">Cancel</button>
          <button className="btn primary">Save changes</button>
        </div>
      </section>

      <section className="section">
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, lineHeight: 1.05 }}>
            Team
          </h2>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Members with access to this workspace
          </div>
        </div>
        {[
          { name: 'Budi Santoso', role: 'Procurement lead', initials: 'BS', access: 'Admin' },
          { name: 'Rina Kartika', role: 'Operations manager', initials: 'RK', access: 'Editor' },
          { name: 'Hendra W.', role: 'Field coordinator', initials: 'HW', access: 'Viewer' },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 28px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'color-mix(in srgb, var(--brand) 12%, var(--surface))', color: 'var(--brand)',
              display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 600,
            }}>
              {m.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.role}</div>
            </div>
            <span className="badge muted">{m.access}</span>
            <button className="btn">Manage</button>
          </div>
        ))}
      </section>
    </>
  );
}
