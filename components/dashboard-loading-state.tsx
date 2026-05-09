import Image from 'next/image';

const SYNC_STEPS = ['Spot price feed', 'Regional NDVI pass', 'Weather signal proxy'];

export default function DashboardLoadingState() {
  return (
    <section className="dashboard-loading-shell" aria-label="Loading dashboard data" aria-busy="true">
      <div className="dashboard-loading-card">
        <div className="dashboard-loading-orb" aria-hidden="true" />
        <div className="dashboard-loading-head">
          <span className="dashboard-loading-kicker">Live procurement workspace</span>
          <div className="dashboard-loading-brand">
            <Image
              src="/logo.png"
              alt="Vela"
              width={40}
              height={40}
              className="dashboard-loading-logo"
            />
            <div>
              <div className="dashboard-loading-wordmark">Vela</div>
              <div className="dashboard-loading-version">Riau operating snapshot</div>
            </div>
          </div>
        </div>

        <div className="dashboard-loading-copy">
          <h1>Preparing this week&apos;s procurement snapshot</h1>
          <p>
            Syncing the latest CPO market read, environmental signals, and district recommendations
            before the dashboard opens.
          </p>
        </div>

        <div className="dashboard-loading-meter" aria-hidden="true">
          <span className="dashboard-loading-meter-bar dashboard-loading-meter-bar-1" />
          <span className="dashboard-loading-meter-bar dashboard-loading-meter-bar-2" />
          <span className="dashboard-loading-meter-bar dashboard-loading-meter-bar-3" />
        </div>

        <div className="dashboard-loading-steps" aria-hidden="true">
          {SYNC_STEPS.map((step, index) => (
            <div
              key={step}
              className="dashboard-loading-step"
              style={{ animationDelay: `${index * 0.18}s` }}
            >
              <span className="dashboard-loading-step-dot" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="dashboard-loading-note">
          First load can take a few seconds while the latest run is assembled on the backend.
        </div>
      </div>
    </section>
  );
}
