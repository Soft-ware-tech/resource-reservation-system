import type { Metadata } from "next";
import Link from "next/link";
import { getColomboDayRange } from "@/lib/bookings/time";
import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { getResourcesAvailability } from "@/lib/resources/availability";

export const metadata: Metadata = { title: "Admin overview | PrimeWave Reserve" };
export const instant = false;

const shortcuts = [
  { href: "/admin/bookings", symbol: "↗", title: "All bookings", detail: "Review reservations and filter by user, resource, status, or date." },
  { href: "/admin/available", symbol: "✳", title: "Available resources", detail: "See everything free to reserve right now." },
  { href: "/admin/in-use", symbol: "◈", title: "Currently in use", detail: "See who has a resource and mark early returns." },
  { href: "/admin/users", symbol: "◎", title: "Manage users", detail: "Review user accounts and enable or suspend access." },
  { href: "/admin/categories", symbol: "◇", title: "Organize categories", detail: "Add or update resource groups." },
  { href: "/admin/resources", symbol: "✧", title: "Manage resources", detail: "Keep shared rooms, equipment, and vehicles up to date." },
];

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  const now = new Date();
  const { startAt: dayStart, endAt: dayEnd } = getColomboDayRange(now);
  const [resourceCount, activeResources, todayBookings] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.findMany({ where: { active: true }, select: { id: true } }),
    prisma.booking.count({ where: { startAt: { gte: dayStart, lt: dayEnd } } }),
  ]);
  const availability = await getResourcesAvailability(activeResources.map(({ id }) => id), now);
  const inUseNow = [...availability.values()].filter(({ isInUse }) => isInUse).length;
  const availableNow = activeResources.length - inUseNow;

  return (
    <section className="welcome-section">
      <p className="eyebrow">YOUR CONTROL ROOM</p>
      <h1 className="display-heading">Manage with <span className="gradient-text">clarity.</span></h1>
      <p className="welcome-copy">
        A live view of what is free, what is being used, and the reservations your team has made today.
      </p>
      <div className="stats-row admin-stats-row">
        <article className="stat-item">
          <span className="stat-value">{String(resourceCount).padStart(2, "0")}</span>
          <span className="stat-label">Total resources</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">{String(availableNow).padStart(2, "0")}</span>
          <span className="stat-label">Available now</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">{String(inUseNow).padStart(2, "0")}</span>
          <span className="stat-label">In use now</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">{String(todayBookings).padStart(2, "0")}</span>
          <span className="stat-label">Today’s bookings</span>
        </article>
      </div>
      <div className="admin-shortcuts admin-dashboard-shortcuts">
        {shortcuts.map((shortcut, index) => (
          <Link className="glass-card admin-shortcut-card" href={shortcut.href} key={shortcut.href}>
            <span className={`category-symbol category-symbol-${index % 3}`} aria-hidden="true">{shortcut.symbol}</span>
            <span><strong>{shortcut.title}</strong><small>{shortcut.detail}</small></span>
            <span className="shortcut-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
      <p className="admin-dashboard-footnote">Today’s totals and times follow the Asia/Colombo time zone.</p>
    </section>
  );
}
