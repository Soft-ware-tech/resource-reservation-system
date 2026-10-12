import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="app-shell">
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <div className="ambient-orb orb-three" aria-hidden="true" />
      <section className="landing-frame">
        <header className="landing-header">
          <Link className="brand" href="/" aria-label="PrimeWave Reserve home">
            <span className="brand-mark" aria-hidden="true">✳</span>
            <span>PRIMEWAVE <span className="brand-light">LAB</span></span>
          </Link>
          <nav className="landing-nav nav-pill" aria-label="Sign-in options">
            <Link className="nav-link" href="/user/login">Team member</Link>
            <Link className="nav-link" href="/admin/login">Administrator</Link>
          </nav>
          <ThemeToggle />
        </header>
        <div className="landing-content">
          <div className="landing-copy">
            <p className="eyebrow">SHARED RESOURCES, IN SYNC</p>
            <h1 className="display-heading">
              Make space for
              <br />
              <span className="gradient-text">what matters.</span>
            </h1>
            <p className="welcome-copy">
              One thoughtful place to discover rooms, equipment, and vehicles—and know what’s free before you need it.
            </p>
            <div className="landing-actions">
              <Link className="gradient-button" href="/user/login">
                Sign in to reserve <span aria-hidden="true">↗</span>
              </Link>
              <Link className="outline-pill" href="/admin/login">Admin portal</Link>
            </div>
          </div>
          <div className="landing-stats">
            <div><strong>03</strong><span>Resource categories</span></div>
            <div><strong>10</strong><span>Shared resources</span></div>
            <div><strong>01</strong><span>Connected workspace</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
