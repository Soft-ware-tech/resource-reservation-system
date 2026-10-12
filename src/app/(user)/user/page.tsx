import Link from "next/link";
import { prisma } from "@/lib/db";

export const instant = false;

export default async function UserDashboardPage() {
  const categories = await prisma.category.findMany({
    where: { resources: { some: { active: true } } },
    include: { _count: { select: { resources: { where: { active: true } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <section className="welcome-section">
      <p className="eyebrow">YOUR SHARED WORKSPACE</p>
      <h1 className="display-heading">Make room for <span className="gradient-text">good work.</span></h1>
      <p className="welcome-copy">
        Find the right room, equipment, or vehicle, and make your next team plan with confidence.
      </p>
      <div className="stats-row">
        <article className="stat-item">
          <span className="stat-value">{String(categories.length).padStart(2, "0")}</span>
          <span className="stat-label">Resource categories</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">{String(categories.reduce((total, category) => total + category._count.resources, 0)).padStart(2, "0")}</span>
          <span className="stat-label">Shared resources</span>
        </article>
        <article className="stat-item">
          <span className="stat-value">24/7</span>
          <span className="stat-label">Availability overview</span>
        </article>
      </div>
      <div className="catalogue-heading">
        <div>
          <p className="eyebrow">EXPLORE THE CATALOGUE</p>
          <h2>What are you looking for?</h2>
        </div>
        <span className="count-pill">{categories.length} categories</span>
      </div>
      {categories.length ? (
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link className="glass-card browse-category-card" href={`/user/categories/${category.slug}`} key={category.id}>
              <span className={`category-symbol category-symbol-${index % 3}`} aria-hidden="true">
                {["◈", "✳", "↗"][index % 3]}
              </span>
              <span className="browse-category-copy">
                <strong>{category.name}</strong>
                <span>{category.description || "Browse shared resources"}</span>
              </span>
              <span className="category-resource-count">{category._count.resources} items <span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-card">
          <p className="eyebrow">NOTHING TO SHOW JUST YET</p>
          <h2>Resources are on their way</h2>
          <p>Once your admin adds active resources, categories will appear here.</p>
        </div>
      )}
    </section>
  );
}
