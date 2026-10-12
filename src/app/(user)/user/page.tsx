import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { UserBookingSummary } from "@/components/user-booking-summary";
import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export const instant = false;

export default async function UserDashboardPage() {
  const [user, categories] = await Promise.all([
    requireRole("USER"),
    prisma.category.findMany({
      where: { resources: { some: { active: true } } },
      include: { _count: { select: { resources: { where: { active: true } } } } },
      orderBy: { name: "asc" },
    }),
  ]);
  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { resource: { include: { category: { select: { name: true } } } } },
    orderBy: [{ startAt: "desc" }],
  });
  const activeBookings = bookings.filter(
    (booking) =>
      (booking.status === BookingStatus.BOOKED || booking.status === BookingStatus.IN_USE) &&
      booking.startAt <= now &&
      booking.endAt > now,
  );
  const upcomingBookings = bookings
    .filter((booking) => booking.status === BookingStatus.BOOKED && booking.startAt > now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const historyBookings = bookings.filter(
    (booking) => !activeBookings.includes(booking) && !upcomingBookings.includes(booking),
  );
  const toSummary = (booking: (typeof bookings)[number]) => ({
    id: booking.id,
    resourceName: booking.resource.name,
    categoryName: booking.resource.category.name,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    status: booking.status,
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
      <UserBookingSummary
        active={activeBookings.map(toSummary)}
        history={historyBookings.map(toSummary)}
        upcoming={upcomingBookings.map(toSummary)}
      />
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
