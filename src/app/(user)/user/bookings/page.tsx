import type { Metadata } from "next";
import { BookingStatus, Prisma } from "@prisma/client";
import { BookingActionForm } from "@/components/booking-actions";
import { requireRole } from "@/lib/auth/server";
import { formatColomboDateTime } from "@/lib/resources/availability";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "My bookings | PrimeWave Reserve" };
export const instant = false;

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function MyBookingsPage({ searchParams }: PageProps) {
  const [user, query] = await Promise.all([requireRole("USER"), searchParams]);
  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { resource: { include: { category: { select: { name: true } } } } },
    orderBy: [{ startAt: "desc" }],
  });

  const upcoming = bookings.filter(
    (booking) => booking.status === BookingStatus.BOOKED && booking.startAt > now,
  );
  const active = bookings.filter(
    (booking) =>
      (booking.status === BookingStatus.BOOKED || booking.status === BookingStatus.IN_USE) &&
      booking.startAt <= now &&
      booking.endAt > now,
  );
  const history = bookings.filter(
    (booking) => !upcoming.includes(booking) && !active.includes(booking),
  );

  const notice = (() => {
    switch (query.success) {
      case "cancelled":
        return "Booking cancelled.";
      case "started":
        return "You have marked the resource as in use.";
      case "returned":
        return "Resource returned and made available.";
    }
    switch (query.error) {
      case "cancel":
        return "This booking can no longer be cancelled.";
      case "return":
        return "This booking is not currently in use.";
      case "start":
        return "This booking has not started yet or is no longer active.";
      case undefined:
        return null;
      default:
        return "The booking action could not be completed.";
    }
  })();

  return (
    <section className="management-section">
      <p className="eyebrow">YOUR RESERVATIONS</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">My bookings<span className="gradient-text">.</span></h1>
          <p className="welcome-copy">Upcoming plans, things in use, and your recent reservation history.</p>
        </div>
        <span className="count-pill">{bookings.length} total</span>
      </div>
      {notice && (
        <p className={query.error ? "form-error page-notice" : "form-success page-notice"} role="status">
          {notice}
        </p>
      )}
      <BookingGroup title="In progress" subtitle="Resources you can return early" bookings={active} now={now} kind="active" />
      <BookingGroup title="Coming up" subtitle="Upcoming reservations you can cancel" bookings={upcoming} now={now} kind="upcoming" />
      <BookingGroup title="History" subtitle="Past and cancelled reservations" bookings={history} now={now} kind="history" />
    </section>
  );
}

type BookingRecord = Prisma.BookingGetPayload<{
  include: { resource: { include: { category: { select: { name: true } } } } };
}>;

function BookingGroup({
  title,
  subtitle,
  bookings,
  now,
  kind,
}: {
  title: string;
  subtitle: string;
  bookings: BookingRecord[];
  now: Date;
  kind: "active" | "upcoming" | "history";
}) {
  return (
    <section className="booking-group">
      <div className="booking-group-heading">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <span className="count-pill">{bookings.length}</span>
      </div>
      {bookings.length ? (
        <div className="booking-list">
          {bookings.map((booking) => {
            const isEnded =
              booking.endAt <= now &&
              (booking.status === BookingStatus.BOOKED || booking.status === BookingStatus.IN_USE);
            const statusLabel = isEnded
              ? "Ended"
              : booking.status === BookingStatus.BOOKED
                ? "Booked"
                : booking.status === BookingStatus.IN_USE
                  ? "In use"
                  : booking.status === BookingStatus.COMPLETED
                    ? "Returned"
                    : "Cancelled";
            const statusClass = isEnded || booking.status === BookingStatus.COMPLETED
              ? "completed-booking"
              : booking.status === BookingStatus.CANCELLED
                ? "cancelled-booking"
                : booking.status === BookingStatus.IN_USE
                  ? "busy-booking"
                  : "available-booking";

            return (
              <article className="glass-card booking-card" key={booking.id}>
                <div className="booking-card-main">
                  <span className={`booking-status ${statusClass}`}>{statusLabel}</span>
                  <p className="resource-category-label">{booking.resource.category.name}</p>
                  <h3>{booking.resource.name}</h3>
                  {booking.purpose && <p className="booking-purpose">{booking.purpose}</p>}
                  <p className="booking-time">
                    {formatColomboDateTime(booking.startAt)} – {formatColomboDateTime(booking.endAt)}
                  </p>
                </div>
                <div className="booking-card-actions">
                  {kind === "upcoming" && (
                    <BookingActionForm action="cancel" bookingId={booking.id} resourceName={booking.resource.name} />
                  )}
                  {kind === "active" && booking.status === BookingStatus.BOOKED && !isEnded && (
                    <BookingActionForm action="start" bookingId={booking.id} resourceName={booking.resource.name} />
                  )}
                  {kind === "active" && !isEnded && (
                    <BookingActionForm action="return" bookingId={booking.id} resourceName={booking.resource.name} />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="glass-card empty-card booking-empty">
          <p>{kind === "upcoming" ? "No upcoming reservations." : kind === "active" ? "Nothing to return right now." : "Your reservation history will appear here."}</p>
        </div>
      )}
    </section>
  );
}
