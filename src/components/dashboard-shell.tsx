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

          <nav className={`nav-pill ${role === "ADMIN" ? "admin-nav" : ""} ${menuOpen ? "nav-open" : ""}`} aria-label="Main navigation">
            {role === "ADMIN" ? (
              [
                ["Overview", "/admin"],
                ["Bookings", "/admin/bookings"],
                ["Available", "/admin/available"],
                ["In use", "/admin/in-use"],
                ["Users", "/admin/users"],
                ["Categories", "/admin/categories"],
                ["Resources", "/admin/resources"],
              ].map(([label, href]) => (
                <Link className="nav-link" href={href} key={href} onClick={() => setMenuOpen(false)}>
                  {label}
                </Link>
              ))
            ) : (
              <>
                <Link className="nav-link" href="/user" onClick={() => setMenuOpen(false)}>
                  Overview
                </Link>
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
