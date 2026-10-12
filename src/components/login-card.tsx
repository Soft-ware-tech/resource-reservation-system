import Link from "next/link";
import type { Role } from "@prisma/client";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginCard({ role }: { role: Role }) {
  const isAdmin = role === "ADMIN";

  return (
    <main className="app-shell login-shell">
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <div className="ambient-orb orb-three" aria-hidden="true" />
      <section className="login-panel glass-card">
        <header className="login-header">
          <Link className="brand" href="/" aria-label="PrimeWave home">
            <span className="brand-mark" aria-hidden="true">✳</span>
            <span>PRIMEWAVE <span className="brand-light">LAB</span></span>
          </Link>
          <ThemeToggle />
        </header>
        <div className="login-copy">
          <p className="eyebrow">{isAdmin ? "ADMINISTRATOR PORTAL" : "TEAM MEMBER PORTAL"}</p>
          <h1>Welcome <span className="gradient-text">back.</span></h1>
          <p>Sign in to your {isAdmin ? "admin workspace" : "reservation workspace"} and pick up where you left off.</p>
        </div>
        <LoginForm role={role} />
        <div className="login-footnote">
          <span>Looking for a different sign-in?</span>
          <Link href={isAdmin ? "/user/login" : "/admin/login"}>
            {isAdmin ? "User login" : "Admin login"} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <p className="demo-hint">
          Demo sign-in: <strong>{isAdmin ? "admin@demo.com / Admin@123" : "user@demo.com / User@123"}</strong>
        </p>
      </section>
    </main>
  );
}
