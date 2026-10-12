import type { Metadata } from "next";
import Link from "next/link";
import { ResourceForm } from "@/components/resource-forms";
import { ResourceDeleteForm } from "@/components/resource-delete-form";
import { ToastNotice } from "@/components/toast-notice";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Manage resources | PrimeWave Reserve" };
export const instant = false;

type PageProps = { searchParams: Promise<{ error?: string; success?: string }> };

export default async function ManageResourcesPage({ searchParams }: PageProps) {
  const [categories, resources, query] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.findMany({
      include: { category: { select: { name: true, slug: true } } },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    searchParams,
  ]);

  const notice = query.error === "bookings"
    ? "This resource has bookings and cannot be deleted."
    : query.error === "missing"
      ? "That resource no longer exists."
      : query.error === "invalid"
        ? "Choose a valid resource."
        : query.success === "deleted"
          ? "Resource deleted."
          : null;

  return (
    <section className="management-section">
      <p className="eyebrow">ADMIN · RESOURCE SETUP</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">Every resource, <span className="gradient-text">in view.</span></h1>
          <p className="welcome-copy">Add, update, and activate the shared things your team can reserve.</p>
        </div>
        <span className="count-pill">{resources.length} resources</span>
      </div>

      <ToastNotice message={notice} variant={query.error ? "error" : "success"} />

      {categories.length === 0 ? (
        <div className="glass-card empty-card">
          <p className="eyebrow">ONE QUICK STEP FIRST</p>
          <h2>Create a category before adding resources</h2>
          <p>Categories keep the resource catalogue easy to browse.</p>
          <Link className="gradient-button inline-button" href="/admin/categories">Manage categories <span aria-hidden="true">↗</span></Link>
        </div>
      ) : (
        <div className="management-grid resources-grid">
          <section className="glass-card management-panel">
            <p className="eyebrow">ADD A RESOURCE</p>
            <h2>Make it available</h2>
            <ResourceForm categories={categories} />
          </section>

          <section className="resource-management-list">
            {resources.map((resource) => (
              <article className="glass-card resource-management-card" key={resource.id}>
                <div className="resource-card-top">
                  <div>
                    <span className="resource-category-label">{resource.category.name}</span>
                    <h2>{resource.name}</h2>
                  </div>
                  <span className={`availability-badge ${resource.active ? "available-badge" : "inactive-badge"}`}>
                    {resource.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="resource-description">{resource.description || "No description added yet."}</p>
                {resource.details && <p className="resource-details">{resource.details}</p>}
                <div className="resource-card-actions">
                  <details className="edit-disclosure">
                    <summary className="outline-pill">Edit</summary>
                    <div className="resource-edit-panel glass-card">
                      <ResourceForm categories={categories} resource={resource} />
                    </div>
                  </details>
                  <ResourceDeleteForm id={resource.id} name={resource.name} />
                  <Link className="text-link" href={`/user/categories/${resource.category.slug}`}>View category ↗</Link>
                </div>
              </article>
            ))}
            {resources.length === 0 && (
              <div className="glass-card empty-card">
                <p className="eyebrow">READY WHEN YOU ARE</p>
                <h2>No resources yet</h2>
                <p>Add a resource using the form to make it visible in the user catalogue.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
