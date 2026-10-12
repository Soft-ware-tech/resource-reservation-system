import type { Metadata } from "next";
import { CategoryDeleteForm, CategoryForm } from "@/components/resource-forms";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Manage categories | PrimeWave Reserve" };
export const instant = false;

export default async function ManageCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { resources: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <section className="management-section">
      <p className="eyebrow">ADMIN · RESOURCE SETUP</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">Categories, <span className="gradient-text">organized.</span></h1>
          <p className="welcome-copy">Group shared resources into the kinds of things your team needs.</p>
        </div>
        <span className="count-pill">{categories.length} {categories.length === 1 ? "category" : "categories"}</span>
      </div>

      <div className="management-grid">
        <section className="glass-card management-panel">
          <p className="eyebrow">ADD A CATEGORY</p>
          <h2>Start a new group</h2>
          <CategoryForm />
        </section>

        <section className="category-management-list">
          {categories.map((category, index) => (
            <article className="glass-card category-management-card" key={category.id}>
              <div className="category-card-heading">
                <span className={`category-symbol category-symbol-${index % 3}`} aria-hidden="true">
                  {["◈", "✳", "↗"][index % 3]}
                </span>
                <div className="category-heading-copy">
                  <h2>{category.name}</h2>
                  <span>{category._count.resources} {category._count.resources === 1 ? "resource" : "resources"}</span>
                </div>
                <details className="edit-disclosure">
                  <summary className="outline-pill">Edit</summary>
                  <div className="edit-popover glass-card">
                    <CategoryForm category={category} />
                  </div>
                </details>
              </div>
              <p className="category-description">
                {category.description || "No description added yet."}
              </p>
              <CategoryDeleteForm id={category.id} name={category.name} />
            </article>
          ))}
          {categories.length === 0 && (
            <div className="glass-card empty-card">
              <p className="eyebrow">A FRESH START</p>
              <h2>No categories yet</h2>
              <p>Create your first group to start organizing shared resources.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
