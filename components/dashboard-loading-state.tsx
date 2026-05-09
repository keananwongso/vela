export default function DashboardLoadingState() {
  return (
    <section className="dashboard-loading-shell" aria-label="Loading dashboard data" aria-busy="true">
      <div className="dashboard-loading-mark-wrap">
        <svg
          className="dashboard-loading-mark"
          viewBox="0 0 240 240"
          role="img"
          aria-label="Vela loading"
        >
          <defs>
            <path
              id="vela-loading-circle"
              d="
                M 120,120
                m -72,0
                a 72,72 0 1,1 144,0
                a 72,72 0 1,1 -144,0
              "
            />
          </defs>

          <text className="dashboard-loading-ring-text">
            <textPath href="#vela-loading-circle" startOffset="0%">
              VELA PROCUREMENT SIGNAL ENGINE VELA PROCUREMENT SIGNAL ENGINE
            </textPath>
          </text>

          <g className="dashboard-loading-center-mark" aria-hidden="true">
            <circle cx="120" cy="120" r="40" className="dashboard-loading-outer-circle" />
            <ellipse cx="120" cy="120" rx="24" ry="40" className="dashboard-loading-vertical-ellipse" />
            <ellipse cx="120" cy="120" rx="40" ry="24" className="dashboard-loading-horizontal-ellipse" />
            <circle cx="120" cy="120" r="14" className="dashboard-loading-inner-dot" />
          </g>
        </svg>

        <p className="dashboard-loading-caption">Preparing this week&apos;s procurement snapshot</p>
      </div>
    </section>
  );
}
