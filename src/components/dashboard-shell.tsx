"use client";

import Link from "next/link";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { signOut } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

type DashboardShellProps = {
  name: string;
  role: Role;
  children: React.ReactNode;
};

export function DashboardShell({ name, role, children }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dashboardPath = role === "ADMIN" ? "/admin" : "/user";
  const roleLabel = role === "ADMIN" ? "Admin" : "User";

  return (
    <main className="app-shell">
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <div className="ambient-orb orb-three" aria-hidden="true" />
      <div className="dashboard-frame">
        <header className="topbar">
          <Link className="brand" href={dashboardPath} aria-label="PrimeWave home">
            <span className="brand-mark" aria-hidden="true">✳</span>
            <span>PRIMEWAVE <span className="brand-light">LAB</span></span>
          </Link>

          <nav className={`nav-pill ${menuOpen ? "nav-open" : ""}`} aria-label="Main navigation">
            <Link className="nav-link" href={dashboardPath} onClick={() => setMenuOpen(false)}>
              Overview
            </Link>
            {role === "ADMIN" ? (
              <>
                <Link className="nav-link" href="/admin/categories" onClick={() => setMenuOpen(false)}>
                  Categories
                </Link>
                <Link className="nav-link" href="/admin/resources" onClick={() => setMenuOpen(false)}>
                  Resources
                </Link>
              </>
            ) : (
              <>
                <Link className="nav-link" href="/user" onClick={() => setMenuOpen(false)}>
                  Browse resources
                </Link>
                <Link className="nav-link" href="/user/bookings" onClick={() => setMenuOpen(false)}>
                  My Bookings
                </Link>
              </>
            )}
          </nav>

          <div className="header-actions">
            <div className="identity">
              <span className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
              <span className="identity-copy">
                <strong>{name}</strong>
                <span className={`role-badge ${role === "ADMIN" ? "admin-badge" : ""}`}>{roleLabel}</span>
              </span>
            </div>
            <ThemeToggle />
            <form action={signOut}>
              <button className="outline-pill logout-button" type="submit">Log out</button>
            </form>
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="icon-button menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
            </button>
          </div>
        </header>
        <div className="dashboard-content">{children}</div>
      </div>
    </main>
  );
}
