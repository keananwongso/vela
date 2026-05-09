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
        <div className="settings-section-head">
          <h2 className="settings-section-title">
            Procurement preferences
          </h2>
          <div className="settings-section-meta">
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

        <div className="settings-actions">
          <button className="btn">Cancel</button>
          <button className="btn primary">Save changes</button>
        </div>
      </section>

      <section className="section">
        <div className="settings-section-head">
          <h2 className="settings-section-title">
            Team
          </h2>
          <div className="settings-section-meta">
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
            className="team-member-row"
          >
            <div className="team-member-avatar">
              {m.initials}
            </div>
            <div className="team-member-meta">
              <div className="team-member-name">{m.name}</div>
              <div className="team-member-role">{m.role}</div>
            </div>
            <span className="badge muted">{m.access}</span>
            <button className="btn">Manage</button>
          </div>
        ))}
      </section>
    </>
  );
}
