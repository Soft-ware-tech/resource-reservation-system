import type { Metadata } from "next";
import { AdminBookingAction } from "@/components/admin-actions";
import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { formatColomboDateTime, getResourcesAvailability } from "@/lib/resources/availability";

export const metadata: Metadata = { title: "Currently in use | PrimeWave Reserve" };
export const instant = false;

type PageProps = { searchParams: Promise<{ success?: string; error?: string }> };

export default async function CurrentlyInUsePage({ searchParams }: PageProps) {
  await requireRole("ADMIN");
  const [resources, query] = await Promise.all([
    prisma.resource.findMany({
      where: { active: true },
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    searchParams,
  ]);
  const availability = await getResourcesAvailability(resources.map(({ id }) => id));
  const inUse = resources.flatMap((resource) => {
    const status = availability.get(resource.id);
    return status?.isInUse && status.nextBooking
      ? [{ resource, booking: status.nextBooking }]
      : [];
  });
  const notice = query.success === "returned"
    ? "The resource has been marked returned and is available again."
    : query.error === "inactive"
      ? "That booking is no longer in use."
      : query.error
        ? "The return could not be completed."
        : null;

  return (
    <section className="management-section">
      <p className="eyebrow">ADMIN · LIVE AVAILABILITY</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">Currently in <span className="gradient-text">use.</span></h1>
          <p className="welcome-copy">See who has each resource and when it is due back.</p>
        </div>
        <span className="count-pill">{inUse.length} in use</span>
      </div>
      {notice && <p className={query.error ? "form-error page-notice" : "form-success page-notice"} role="status">{notice}</p>}
      {inUse.length ? (
        <div className="booking-list">
          {inUse.map(({ resource, booking }) => (
            <article className="glass-card booking-card admin-in-use-card" key={booking.id}>
              <div className="booking-card-main">
                <span className="booking-status busy-booking">In use</span>
                <p className="resource-category-label">{resource.category.name}</p>
                <h3>{resource.name}</h3>
                <p className="booking-purpose">Currently held by <strong>{booking.user.name}</strong></p>
                <p className="booking-time">Available after {formatColomboDateTime(booking.endAt)}</p>
              </div>
              <div className="booking-card-actions">
                <AdminBookingAction action="return" bookingId={booking.id} resourceName={resource.name} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-card">
          <p className="eyebrow">EVERYTHING IS READY</p>
          <h2>No resources are currently in use</h2>
          <p>When a reservation begins, the current holder and return time will appear here.</p>
        </div>
      )}
    </section>
  );
}
