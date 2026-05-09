'use client';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`dashboard-skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export default function DashboardLoadingState() {
  return (
    <div className="dashboard-loading-shell" aria-label="Loading dashboard data" aria-busy="true">
      <div className="topbar">
        <div>
          <SkeletonBlock className="dashboard-skeleton-crumb" />
          <SkeletonBlock className="dashboard-skeleton-title" />
          <SkeletonBlock className="dashboard-skeleton-subtitle" />
        </div>
        <div className="topbar-actions">
          <SkeletonBlock className="dashboard-skeleton-button" />
          <SkeletonBlock className="dashboard-skeleton-button" />
          <SkeletonBlock className="dashboard-skeleton-button primary" />
        </div>
      </div>

      <section className="dashboard-skeleton-panel dashboard-skeleton-hero">
        <SkeletonBlock className="dashboard-skeleton-eyebrow" />
        <SkeletonBlock className="dashboard-skeleton-hero-title" />
        <SkeletonBlock className="dashboard-skeleton-hero-copy" />
        <div className="dashboard-skeleton-chip-row">
          <SkeletonBlock className="dashboard-skeleton-chip" />
          <SkeletonBlock className="dashboard-skeleton-chip wide" />
          <SkeletonBlock className="dashboard-skeleton-chip" />
        </div>
      </section>

      <div className="dashboard-skeleton-grid">
        <section className="dashboard-skeleton-panel">
          <SkeletonBlock className="dashboard-skeleton-section-title" />
          <SkeletonBlock className="dashboard-skeleton-section-copy" />
          <div className="dashboard-skeleton-card-stack">
            <SkeletonBlock className="dashboard-skeleton-card" />
            <SkeletonBlock className="dashboard-skeleton-card" />
            <SkeletonBlock className="dashboard-skeleton-card" />
          </div>
        </section>

        <section className="dashboard-skeleton-panel">
          <SkeletonBlock className="dashboard-skeleton-section-title" />
          <SkeletonBlock className="dashboard-skeleton-section-copy" />
          <div className="dashboard-skeleton-card-stack">
            <SkeletonBlock className="dashboard-skeleton-card" />
            <SkeletonBlock className="dashboard-skeleton-card" />
          </div>
        </section>

        <section className="dashboard-skeleton-panel">
          <SkeletonBlock className="dashboard-skeleton-section-title" />
          <SkeletonBlock className="dashboard-skeleton-section-copy" />
          <div className="dashboard-skeleton-card-stack">
            <SkeletonBlock className="dashboard-skeleton-card" />
          </div>
        </section>
      </div>
    </div>
  );
}
