import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import { getDefaultColomboBookingTimes } from "@/lib/bookings/time";
import { formatColomboDateTime, getResourceAvailability } from "@/lib/resources/availability";
import { prisma } from "@/lib/db";

type PageProps = { params: Promise<{ slug: string }> };

export const instant = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug }, select: { name: true } });
  return { title: category ? `${category.name} | PrimeWave Reserve` : "Category | PrimeWave Reserve" };
}

export default async function BrowseCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { resources: { where: { active: true }, orderBy: { name: "asc" } } },
  });
  if (!category) notFound();

  const availability = await Promise.all(
    category.resources.map(async (resource) => ({
      resource,
      status: await getResourceAvailability(resource.id),
    })),
  );
  const availableNow = availability.filter(({ status }) => !status.isInUse).length;
  const defaultBookingTimes = getDefaultColomboBookingTimes();

  return (
    <section className="management-section">
      <Link className="back-link" href="/user">← All categories</Link>
      <p className="eyebrow">RESOURCE CATEGORY</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">{category.name}<span className="gradient-text">.</span></h1>
          <p className="welcome-copy">{category.description || "Explore the shared resources in this category."}</p>
        </div>
        <span className="availability-summary">
          <span className="status-dot available-dot" aria-hidden="true" />
          {availableNow} available now
        </span>
      </div>

      {availability.length ? (
        <div className="browse-resource-grid">
          {availability.map(({ resource, status }, index) => (
            <article className="glass-card browse-resource-card" key={resource.id}>
              {resource.imageUrl ? (
                <div className="resource-image">
                  <Image
                    alt=""
                    fill
                    sizes="(max-width: 740px) 100vw, 50vw"
                    src={resource.imageUrl}
                    unoptimized
                  />
                </div>
              ) : (
                <div className={`resource-art resource-art-${index % 3}`} aria-hidden="true">
                  <span>{["◈", "✳", "↗"][index % 3]}</span>
                </div>
              )}
              <div className="browse-resource-content">
                <span className={`availability-badge ${status.isInUse ? "busy-badge" : "available-badge"}`}>
                  <span className={`status-dot ${status.isInUse ? "busy-dot" : "available-dot"}`} aria-hidden="true" />
                  {status.isInUse && status.until
                    ? `In use until ${formatColomboDateTime(status.until)}`
                    : "Available now"}
                </span>
                <h2>{resource.name}</h2>
                {resource.details && <p className="resource-details">{resource.details}</p>}
                <p className="resource-description">
                  {resource.description || "No additional description provided."}
                </p>
                {status.isInUse && status.nextBooking && (
                  <p className="current-holder">Currently held by {status.nextBooking.user.name}</p>
                )}
                {!status.isInUse && status.until && (
                  <p className="next-booking-hint">Next reserved until {formatColomboDateTime(status.until)}</p>
                )}
                <details className="booking-disclosure" suppressHydrationWarning>
                  <summary className="gradient-button booking-trigger">
                    Reserve this resource <span aria-hidden="true">↗</span>
                  </summary>
                  <div className="booking-form-panel glass-card">
                    <BookingForm
                      defaultEndAt={defaultBookingTimes.endAt}
                      defaultStartAt={defaultBookingTimes.startAt}
                      resourceId={resource.id}
                    />
                  </div>
                </details>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-card">
          <p className="eyebrow">A LITTLE QUIET HERE</p>
          <h2>No active resources in {category.name}</h2>
          <p>Check back later or explore another category.</p>
        </div>
      )}
    </section>
  );
}
