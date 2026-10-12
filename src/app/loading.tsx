export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" className="app-shell">
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <div className="dashboard-frame loading-frame">
        <div className="loading-indicator">
          <span aria-hidden="true" className="loading-spinner" />
          <span>Loading your workspace…</span>
        </div>
      </div>
    </main>
  );
}
