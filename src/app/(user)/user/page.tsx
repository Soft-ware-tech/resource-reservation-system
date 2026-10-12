export default function UserDashboardPage() {
  return (
    <section className="welcome-section">
      <p className="eyebrow">YOUR SHARED WORKSPACE</p>
      <h1 className="display-heading">Make room for <span className="gradient-text">good work.</span></h1>
      <p className="welcome-copy">
        Find the right room, equipment, or vehicle, and make your next team plan with confidence.
      </p>
      <div className="stats-row">
        <article className="stat-item">
          <span className="stat-value">03</span>
          <span className="stat-label">Resource categories</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">10</span>
          <span className="stat-label">Shared resources</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">24/7</span>
          <span className="stat-label">Availability overview</span>
        </article>
      </div>
      <div className="glass-card intro-card">
        <div className="intro-icon" aria-hidden="true">↗</div>
        <div>
          <p className="eyebrow">PHASE 2 · ACCESS READY</p>
          <h2>Your reservation space is ready.</h2>
          <p>Browseable categories and booking tools are coming in the next build phases.</p>
        </div>
      </div>
    </section>
  );
}
