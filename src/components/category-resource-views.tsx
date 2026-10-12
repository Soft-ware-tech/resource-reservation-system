"use client";

import Image from "next/image";
import { BookingStatus } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo, useState } from "react";
import { BookingForm } from "@/components/booking-form";
import { BOOKING_TIME_ZONE } from "@/lib/bookings/time";

type Resource = {
  id: string;
  name: string;
  description: string | null;
  details: string | null;
  imageUrl: string | null;
  isInUse: boolean;
  availableAfter: string | null;
  currentHolder: string | null;
};

type CategoryBooking = {
  id: string;
  resourceId: string;
  resourceName: string;
  userName: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
};

type Props = {
  resources: Resource[];
  bookings: CategoryBooking[];
  initialMonth: string;
  todayDate: string;
  defaultBookingTimes: { startAt: string; endAt: string };
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DISPLAY_TIME_ZONE = BOOKING_TIME_ZONE;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return formatInTimeZone(new Date(value), DISPLAY_TIME_ZONE, "h:mm a");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function previousDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return dateKey(previous.getUTCFullYear(), previous.getUTCMonth(), previous.getUTCDate());
}

function monthDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthIndex = monthNumber - 1;
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const offset = (firstWeekday + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, monthIndex, index - offset + 1));
    return {
      key: dateKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthIndex,
    };
  });
}

function bookingDayRange(booking: CategoryBooking) {
  const startDay = formatInTimeZone(new Date(booking.startAt), DISPLAY_TIME_ZONE, "yyyy-MM-dd");
  const endTime = formatInTimeZone(new Date(booking.endAt), DISPLAY_TIME_ZONE, "HH:mm");
  const endDay = formatInTimeZone(new Date(booking.endAt), DISPLAY_TIME_ZONE, "yyyy-MM-dd");
  return { startDay, endDay: endTime === "00:00" ? previousDateKey(endDay) : endDay };
}

function bookingTimeForDay(booking: CategoryBooking, day: string) {
  const { startDay, endDay } = bookingDayRange(booking);
  if (startDay === endDay) return `${formatTime(booking.startAt)} – ${formatTime(booking.endAt)}`;
  if (day === startDay) return `${formatTime(booking.startAt)} →`;
  if (day === endDay) return `→ ${formatTime(booking.endAt)}`;
  return "All day";
}

function monthTitle(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-LK", {
    month: "long",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(Date.UTC(year, monthNumber - 1, 15, 12)));
}

function statusLabel(status: BookingStatus) {
  return status === BookingStatus.IN_USE ? "In use" : "Booked";
}

export function CategoryResourceViews({
  resources,
  bookings,
  initialMonth,
  todayDate,
  defaultBookingTimes,
}: Props) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [month, setMonth] = useState(initialMonth);
  const days = useMemo(() => monthDays(month), [month]);
  const bookingsByDay = useMemo(
    () =>
      new Map(
        days.map(({ key }) => [
          key,
          bookings.filter((booking) => {
            const { startDay, endDay } = bookingDayRange(booking);
            return startDay <= key && endDay >= key;
          }),
        ]),
      ),
    [bookings, days],
  );
  const daysWithBookings = days.filter(({ key, inMonth }) => inMonth && (bookingsByDay.get(key)?.length ?? 0) > 0);
  const today = todayDate;

  return (
    <div className="category-resource-views">
      <section aria-labelledby="resource-availability-heading">
        <div className="view-section-heading">
          <div>
            <p className="eyebrow">AT A GLANCE</p>
            <h2 id="resource-availability-heading">Resource availability</h2>
          </div>
          <span className="count-pill">{resources.length} resources</span>
        </div>
        <div className="browse-resource-grid">
          {resources.map((resource, index) => (
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
                <span className={`availability-badge ${resource.isInUse ? "busy-badge" : "available-badge"}`}>
                  <span className={`status-dot ${resource.isInUse ? "busy-dot" : "available-dot"}`} aria-hidden="true" />
                  {resource.isInUse ? "Busy now" : "Available now"}
                </span>
                <h2>{resource.name}</h2>
                {resource.details && <p className="resource-details">{resource.details}</p>}
                <p className="resource-description">
                  {resource.description || "No additional description provided."}
                </p>
                {resource.isInUse && resource.availableAfter && (
                  <p className="current-holder">
                    Available after {formatDateTime(resource.availableAfter)}
                    {resource.currentHolder ? ` · Currently held by ${resource.currentHolder}` : ""}
                  </p>
                )}
                {!resource.isInUse && resource.currentHolder && (
                  <p className="next-booking-hint">Next reservation by {resource.currentHolder}</p>
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
      </section>

      <section aria-labelledby="booking-schedule-heading" className="category-schedule-section">
        <div className="view-section-heading schedule-heading">
          <div>
            <p className="eyebrow">SHARED SCHEDULE</p>
            <h2 id="booking-schedule-heading">Bookings &amp; availability</h2>
          </div>
          <div aria-label="Booking view" className="view-toggle" role="group">
            <button
              aria-pressed={view === "calendar"}
              className={view === "calendar" ? "view-toggle-button active-view" : "view-toggle-button"}
              onClick={() => setView("calendar")}
              type="button"
            >
              Calendar view
            </button>
            <button
              aria-pressed={view === "list"}
              className={view === "list" ? "view-toggle-button active-view" : "view-toggle-button"}
              onClick={() => setView("list")}
              type="button"
            >
              List view
            </button>
          </div>
        </div>

        {view === "calendar" ? (
          <section aria-label={`Bookings calendar for ${monthTitle(month)}`} className="glass-card schedule-panel">
            <div className="calendar-toolbar">
              <div>
                <p className="eyebrow">COLOMBO TIME</p>
                <h3>{monthTitle(month)}</h3>
              </div>
              <div className="calendar-navigation">
                <button aria-label="Previous month" className="outline-button calendar-nav-button" onClick={() => setMonth(shiftMonth(month, -1))} type="button">
                  ← <span className="visually-hidden">Previous month</span>
                </button>
                <button className="outline-button calendar-today-button" onClick={() => setMonth(initialMonth)} type="button">This month</button>
                <button aria-label="Next month" className="outline-button calendar-nav-button" onClick={() => setMonth(shiftMonth(month, 1))} type="button">
                  → <span className="visually-hidden">Next month</span>
                </button>
              </div>
            </div>
            <div aria-hidden="true" className="calendar-weekdays">
              {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className="calendar-grid">
              {days.map(({ key, day, inMonth }) => {
                const dayBookings = bookingsByDay.get(key) ?? [];
                return (
                  <div
                    aria-label={`${key}${dayBookings.length ? `, ${dayBookings.length} bookings` : ", no bookings"}`}
                    className={`calendar-day${inMonth ? "" : " outside-month"}${key === today ? " today" : ""}`}
                    key={key}
                  >
                    <span className="calendar-day-number">{day}</span>
                    <div className="calendar-day-events">
                      {dayBookings.map((booking) => (
                        <div className={`calendar-event${booking.status === BookingStatus.IN_USE ? " event-in-use" : ""}`} key={`${key}-${booking.id}`}>
                          <span className="calendar-event-resource">{booking.resourceName}</span>
                          <span className="calendar-event-details">
                            {bookingTimeForDay(booking, key)} · {booking.userName}
                          </span>
                          <span className="visually-hidden">{statusLabel(booking.status)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="calendar-mobile-agenda">
              {daysWithBookings.length ? daysWithBookings.map(({ key }) => (
                <section className="agenda-day" key={key}>
                  <h4>{key === today ? "Today" : `${WEEKDAYS[(new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7]}, ${key}`}</h4>
                  <BookingEntries bookings={bookingsByDay.get(key) ?? []} day={key} />
                </section>
              )) : <p className="schedule-empty-copy">No bookings this month. Every resource is available unless its availability card says otherwise.</p>}
            </div>
          </section>
        ) : (
          <section aria-label="Bookings list" className="booking-schedule-list">
            {bookings.length ? bookings.map((booking) => (
              <article className="glass-card schedule-booking-row" key={booking.id}>
                <div className="schedule-booking-main">
                  <span className={`booking-status ${booking.status === BookingStatus.IN_USE ? "busy-booking" : "available-booking"}`}>
                    {statusLabel(booking.status)}
                  </span>
                  <h3>{booking.resourceName}</h3>
                  <p>{formatDateTime(booking.startAt)} – {formatDateTime(booking.endAt)}</p>
                </div>
                <div className="schedule-booking-holder">
                  <span className="eyebrow">RESERVED BY</span>
                  <strong>{booking.userName}</strong>
                </div>
              </article>
            )) : (
              <div className="glass-card empty-card schedule-empty">
                <p className="eyebrow">CLEAR SCHEDULE</p>
                <h3>No upcoming bookings</h3>
                <p>All resources are currently open for reservation.</p>
              </div>
            )}
          </section>
        )}
      </section>
    </div>
  );
}

function BookingEntries({ bookings, day }: { bookings: CategoryBooking[]; day: string }) {
  return (
    <div className="agenda-booking-list">
      {bookings.map((booking) => (
        <article className="agenda-booking" key={booking.id}>
          <span className={`status-dot ${booking.status === BookingStatus.IN_USE ? "busy-dot" : "available-dot"}`} aria-hidden="true" />
          <div>
            <strong>{booking.resourceName}</strong>
            <p>{bookingTimeForDay(booking, day)} · {booking.userName}</p>
          </div>
          <span className="agenda-status">{statusLabel(booking.status)}</span>
        </article>
      ))}
    </div>
  );
}
