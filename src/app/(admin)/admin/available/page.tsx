import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { getResourcesAvailability } from "@/lib/resources/availability";

export const metadata: Metadata = { title: "Available resources | PrimeWave Reserve" };
export const instant = false;

export default async function AvailableResourcesPage() {
  await requireRole("ADMIN");
  const resources = await prisma.resource.findMany({
    where: { active: true },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  const availability = await getResourcesAvailability(resources.map(({ id }) => id));
  const available = resources.filter(({ id }) => !availability.get(id)?.isInUse);

  return (
    <section className="management-section">
      <p className="eyebrow">ADMIN · LIVE AVAILABILITY</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">Available <span className="gradient-text">right now.</span></h1>
          <p className="welcome-copy">Active resources with no reservation in progress at this moment.</p>
        </div>
        <span className="count-pill">{available.length} available</span>
      </div>
      {available.length ? (
        <div className="browse-resource-grid">
          {available.map((resource) => (
            <article className="glass-card admin-availability-card" key={resource.id}>
              <span className="availability-badge available-badge"><span className="status-dot available-dot" aria-hidden="true" />Available now</span>
              <p className="resource-category-label">{resource.category.name}</p>
              <h2>{resource.name}</h2>
              <p>{resource.description || resource.details || "Ready to reserve."}</p>
              <Link className="outline-pill admin-resource-link" href={`/user/categories/${resource.category.slug}`}>Open category <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-card">
          <p className="eyebrow">ALL RESOURCES ARE BUSY</p>
          <h2>Nothing is available right now</h2>
          <p>Check the in-use list to see when resources will become free.</p>
          <Link className="gradient-button inline-button" href="/admin/in-use">View currently in use <span aria-hidden="true">↗</span></Link>
        </div>
      )}
    </section>
  );
}
