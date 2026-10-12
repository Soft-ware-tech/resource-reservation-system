export default function AdminDashboardPage() {
  return (
    <section className="welcome-section">
      <p className="eyebrow">YOUR CONTROL ROOM</p>
      <h1 className="display-heading">Manage with <span className="gradient-text">clarity.</span></h1>
      <p className="welcome-copy">
        A calmer way to coordinate the spaces, equipment, and vehicles your team shares.
      </p>
      <div className="stats-row">
        <article className="stat-item">
          <span className="stat-value">01</span>
          <span className="stat-label">Admin workspace</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">03</span>
          <span className="stat-label">Resource categories</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">10</span>
          <span className="stat-label">Seeded resources</span>
        </article>
      </div>
      <div className="glass-card intro-card">
        <div className="intro-icon" aria-hidden="true">✳</div>
        <div>
          <p className="eyebrow">PHASE 2 · ACCESS READY</p>
          <h2>Your admin workspace is ready.</h2>
          <p>Resource management and live booking insights will be connected in the next build phases.</p>
        </div>
      </div>
    </section>
  );
}
