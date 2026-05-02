export default function SettingsPage() {
  const rows = [
    { label: 'Mill', val: 'PT Sawit Riau · Pekanbaru', sub: 'Primary processing facility' },
    { label: 'Default region', val: 'Riau Province · 12 kecamatan', sub: 'Visible on Overview map' },
    { label: 'Moisture threshold', val: '24%', sub: 'Districts above this enter Monitor status' },
    { label: 'FFA threshold', val: '3.5%', sub: 'Districts above this enter At-risk status' },
    { label: 'CPO favorable trigger', val: 'price ≥ 4-week average', sub: 'Drives the favorable / caution signal' },
    { label: 'Sync cadence', val: 'Every 30 minutes', sub: 'Satellite NDVI + weather + spot price feeds' },
    { label: 'Notifications', val: 'Email + SMS to procurement lead', sub: 'Daily digest at 06:00 WIB' },
  ];

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
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Procurement preferences</h2>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            Applies to all dispatch recommendations for PT Sawit Riau
          </div>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr auto',
              gap: 24,
              padding: '16px 28px',
              borderBottom: '1px solid var(--border)',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{row.label}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{row.val}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{row.sub}</div>
            </div>
            <button className="btn">Edit</button>
          </div>
        ))}

        <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn">Cancel</button>
          <button className="btn primary">Save changes</button>
        </div>
      </section>

      <section className="section">
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Team</h2>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
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
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 600,
            }}>
              {m.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.role}</div>
            </div>
            <span className="badge muted">{m.access}</span>
            <button className="btn">Manage</button>
          </div>
        ))}
      </section>
    </>
  );
}
