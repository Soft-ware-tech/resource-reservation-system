import Link from "next/link";
import { prisma } from "@/lib/db";

export const instant = false;

export default async function AdminDashboardPage() {
  const [categoryCount, resourceCount, activeCount] = await Promise.all([
    prisma.category.count(),
    prisma.resource.count(),
    prisma.resource.count({ where: { active: true } }),
  ]);

  return (
    <section className="welcome-section">
      <p className="eyebrow">YOUR CONTROL ROOM</p>
      <h1 className="display-heading">Manage with <span className="gradient-text">clarity.</span></h1>
      <p className="welcome-copy">
        A calmer way to coordinate the spaces, equipment, and vehicles your team shares.
      </p>
      <div className="stats-row">
        <article className="stat-item">
          <span className="stat-value">{String(categoryCount).padStart(2, "0")}</span>
          <span className="stat-label">Resource categories</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">{String(resourceCount).padStart(2, "0")}</span>
          <span className="stat-label">Total resources</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">{String(activeCount).padStart(2, "0")}</span>
          <span className="stat-label">Active resources</span>
        </article>
      </div>
      <div className="admin-shortcuts">
        <Link className="glass-card admin-shortcut-card" href="/admin/categories">
          <span className="category-symbol category-symbol-0" aria-hidden="true">✳</span>
          <span><strong>Organize categories</strong><small>Add or update the groups your team browses.</small></span>
          <span className="shortcut-arrow" aria-hidden="true">↗</span>
        </Link>
        <Link className="glass-card admin-shortcut-card" href="/admin/resources">
          <span className="category-symbol category-symbol-2" aria-hidden="true">◈</span>
          <span><strong>Manage resources</strong><small>Keep shared rooms, equipment, and vehicles up to date.</small></span>
          <span className="shortcut-arrow" aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
