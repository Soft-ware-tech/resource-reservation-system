import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { formatColomboDateTime } from "@/lib/resources/availability";

type SummaryBooking = {
  id: string;
  resourceName: string;
  categoryName: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
};

export function UserBookingSummary({
  upcoming,
  active,
  history,
}: {
  upcoming: SummaryBooking[];
  active: SummaryBooking[];
  history: SummaryBooking[];
}) {
  const groups = [
    { title: "Active now", subtitle: "Your current reservations", bookings: active },
    { title: "Coming up", subtitle: "Your next plans", bookings: upcoming },
    { title: "History", subtitle: "Recently completed or cancelled", bookings: history },
  ];

  return (
    <section className="user-bookings-overview" aria-labelledby="user-bookings-heading">
      <div className="catalogue-heading">
        <div>
          <p className="eyebrow">YOUR RESERVATIONS</p>
          <h2 id="user-bookings-heading">My bookings</h2>
        </div>
        <Link className="outline-pill user-bookings-link" href="/user/bookings">All bookings <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="user-booking-summary-grid">
        {groups.map((group) => (
          <section className="glass-card user-booking-summary-card" key={group.title}>
            <div className="user-booking-summary-heading">
              <div>
                <p className="eyebrow">{group.subtitle}</p>
                <h3>{group.title}</h3>
              </div>
              <span className="count-pill">{group.bookings.length}</span>
            </div>
            {group.bookings.length ? (
              <ul className="user-booking-summary-list">
                {group.bookings.slice(0, 2).map((booking) => (
                  <li key={booking.id}>
                    <strong>{booking.resourceName}</strong>
                    <span>{booking.categoryName}</span>
                    <time dateTime={booking.startAt}>
                      {formatColomboDateTime(new Date(booking.startAt))}
                      {group.title !== "History" && ` – ${formatColomboDateTime(new Date(booking.endAt))}`}
                    </time>
                    {group.title === "History" && (
                      <span className="summary-history-status">
                        {booking.status === BookingStatus.CANCELLED ? "Cancelled" : booking.status === BookingStatus.COMPLETED ? "Returned" : "Ended"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="user-booking-summary-empty">
                {group.title === "Active now" ? "You have nothing in use." : group.title === "Coming up" ? "No upcoming reservations." : "Your past reservations will appear here."}
              </p>
            )}
            {group.bookings.length > 2 && <Link className="text-link user-summary-more" href="/user/bookings">View all {group.title.toLowerCase()} ↗</Link>}
          </section>
        ))}
      </div>
    </section>
  );
}
