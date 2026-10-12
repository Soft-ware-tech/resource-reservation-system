import type { Metadata } from "next";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { notFound } from "next/navigation";
import { CategoryResourceViews } from "@/components/category-resource-views";
import { BOOKING_TIME_ZONE, getDefaultColomboBookingTimes } from "@/lib/bookings/time";
import { getResourcesAvailability } from "@/lib/resources/availability";
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

  const now = new Date();
  const resourceAvailability = await getResourcesAvailability(category.resources.map(({ id }) => id), now);
  const availability = category.resources.map((resource) => ({
    resource,
    status: resourceAvailability.get(resource.id) ?? { isInUse: false, until: null, nextBooking: null },
  }));
  const availableNow = availability.filter(({ status }) => !status.isInUse).length;
  const defaultBookingTimes = getDefaultColomboBookingTimes();
  const bookings = category.resources.length
    ? await prisma.booking.findMany({
        where: {
          resourceId: { in: category.resources.map(({ id }) => id) },
          status: { in: [BookingStatus.BOOKED, BookingStatus.IN_USE] },
          endAt: { gt: now },
        },
        include: {
          resource: { select: { name: true } },
          user: { select: { name: true } },
        },
        orderBy: [{ startAt: "asc" }, { resource: { name: "asc" } }],
      })
    : [];

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
        <CategoryResourceViews
          bookings={bookings.map((booking) => ({
            id: booking.id,
            resourceId: booking.resourceId,
            resourceName: booking.resource.name,
            userName: booking.user.name,
            startAt: booking.startAt.toISOString(),
            endAt: booking.endAt.toISOString(),
            status: booking.status,
          }))}
          defaultBookingTimes={defaultBookingTimes}
          initialMonth={formatInTimeZone(now, BOOKING_TIME_ZONE, "yyyy-MM")}
          todayDate={formatInTimeZone(now, BOOKING_TIME_ZONE, "yyyy-MM-dd")}
          resources={availability.map(({ resource, status }) => ({
            id: resource.id,
            name: resource.name,
            description: resource.description,
            details: resource.details,
            imageUrl: resource.imageUrl,
            isInUse: status.isInUse,
            availableAfter: status.isInUse ? status.until?.toISOString() ?? null : null,
            currentHolder: status.nextBooking?.user.name ?? null,
          }))}
        />
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
