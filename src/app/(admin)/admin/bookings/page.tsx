import type { Metadata } from "next";
import { BookingStatus } from "@prisma/client";
import { isValid, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { AdminBookingAction } from "@/components/admin-actions";
import { ToastNotice } from "@/components/toast-notice";
import { getColomboDayRange } from "@/lib/bookings/time";
import { requireRole } from "@/lib/auth/server";
import { formatColomboDateTime } from "@/lib/resources/availability";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "All bookings | PrimeWave Reserve" };
export const instant = false;

type PageProps = {
  searchParams: Promise<{
    category?: string;
    user?: string;
    status?: string;
    date?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
};

const ACTIVE_STATUSES: BookingStatus[] = [BookingStatus.BOOKED, BookingStatus.IN_USE];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES = Object.values(BookingStatus);
const PAGE_SIZE = 50;

function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = parseISO(`${value}T00:00:00Z`);
  return isValid(parsed) && formatInTimeZone(parsed, "UTC", "yyyy-MM-dd") === value ? value : null;
}

function statusClass(status: BookingStatus) {
  if (status === BookingStatus.IN_USE) return "busy-booking";
  if (status === BookingStatus.COMPLETED) return "completed-booking";
  if (status === BookingStatus.CANCELLED) return "cancelled-booking";
  return "available-booking";
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireRole("ADMIN");
  const [query, categories, users] = await Promise.all([
    searchParams,
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const date = validDate(query.date);
  const status = VALID_STATUSES.includes(query.status as BookingStatus)
    ? (query.status as BookingStatus)
    : undefined;
  const categoryId = query.category && UUID_PATTERN.test(query.category) ? query.category : undefined;
  const userId = query.user && UUID_PATTERN.test(query.user) ? query.user : undefined;
  const dayRange = date ? getColomboDayRange(parseISO(`${date}T00:00:00Z`)) : undefined;
  const requestedPage = query.page && /^\d+$/.test(query.page) ? Number(query.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = {
    ...(categoryId ? { resource: { categoryId } } : {}),
    ...(userId ? { userId } : {}),
    ...(status ? { status } : {}),
    ...(dayRange ? { startAt: { gte: dayRange.startAt, lt: dayRange.endAt } } : {}),
  };
  const totalCount = await prisma.booking.count({ where });
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const [bookings, activeCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        resource: { select: { name: true, category: { select: { name: true } } } },
      },
      orderBy: [{ startAt: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    !status || ACTIVE_STATUSES.includes(status)
      ? prisma.booking.count({ where: { ...where, status: { in: ACTIVE_STATUSES } } })
      : Promise.resolve(0),
  ]);

  const params = new URLSearchParams();
  if (categoryId) params.set("category", categoryId);
  if (userId) params.set("user", userId);
  if (status) params.set("status", status);
  if (date) params.set("date", date);
  const filterQuery = params.toString();
  const pageHref = (targetPage: number) => {
    const pageParams = new URLSearchParams(params);
    pageParams.set("page", String(targetPage));
    return `/admin/bookings?${pageParams.toString()}`;
  };

  const notice = query.success === "cancelled"
    ? "Booking cancelled and the resource is available again."
    : query.error === "inactive"
      ? "That booking is no longer active."
      : query.error
        ? "That booking request could not be completed."
        : null;

  return (
    <section className="management-section">
      <p className="eyebrow">ADMIN · RESERVATIONS</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">Every booking, <span className="gradient-text">in view.</span></h1>
          <p className="welcome-copy">Filter reservations by category, user, status, or their Colombo start date.</p>
        </div>
        <span className="count-pill">{totalCount} matches</span>
      </div>
      <ToastNotice message={notice} variant={query.error ? "error" : "success"} />

      <div className="admin-booking-summary">
        <article className="glass-card admin-summary-card">
          <span className="eyebrow">MATCHING BOOKINGS</span>
          <strong>{totalCount}</strong>
        </article>
        <article className="glass-card admin-summary-card">
          <span className="eyebrow">ACTIVE RESERVATIONS</span>
          <strong>{activeCount}</strong>
        </article>
      </div>

      <form action="/admin/bookings" className="glass-card booking-filter-form" method="get">
        <label>
          <span>Category</span>
          <select defaultValue={categoryId ?? ""} name="category">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label>
          <span>User</span>
          <select defaultValue={userId ?? ""} name="user">
            <option value="">All users</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select defaultValue={status ?? ""} name="status">
            <option value="">All statuses</option>
            {VALID_STATUSES.map((bookingStatus) => <option key={bookingStatus} value={bookingStatus}>{bookingStatus.replace("_", " ")}</option>)}
          </select>
        </label>
        <label>
          <span>Start date · Colombo</span>
          <input defaultValue={date ?? ""} name="date" type="date" />
        </label>
        <div className="filter-actions">
          <button className="gradient-button inline-button" type="submit">Apply filters</button>
          {filterQuery && <a className="outline-pill clear-filter-button" href="/admin/bookings">Clear</a>}
        </div>
      </form>

      {bookings.length ? (
        <>
          <div className="admin-table-summary">
            <p>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} matching bookings</p>
          </div>
          <div className="glass-card admin-table-frame">
            <table className="admin-bookings-table">
              <thead>
                <tr>
                  <th scope="col">Resource</th>
                  <th scope="col">Booked by</th>
                  <th scope="col">Time range · Colombo</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td data-label="Resource">
                      <strong>{booking.resource.name}</strong>
                      <span className="table-secondary">{booking.resource.category.name}</span>
                    </td>
                    <td data-label="Booked by">
                      <strong>{booking.user.name}</strong>
                      <span className="table-secondary">{booking.user.email}</span>
                    </td>
                    <td data-label="Time range · Colombo">
                      <span>{formatColomboDateTime(booking.startAt)}</span>
                      <span className="table-secondary">to {formatColomboDateTime(booking.endAt)}</span>
                    </td>
                    <td data-label="Status">
                      <span className={`booking-status ${statusClass(booking.status)}`}>{booking.status.replace("_", " ")}</span>
                    </td>
                    <td className="admin-table-actions" data-label="Actions">
                      {ACTIVE_STATUSES.includes(booking.status) && (
                        <AdminBookingAction action="cancel" bookingId={booking.id} resourceName={booking.resource.name} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <nav aria-label="Booking pages" className="admin-pagination">
              {currentPage > 1
                ? <a className="outline-pill" href={pageHref(currentPage - 1)}>← Previous</a>
                : <span className="outline-pill pagination-disabled">← Previous</span>}
              <span>Page {currentPage} of {pageCount}</span>
              {currentPage < pageCount
                ? <a className="outline-pill" href={pageHref(currentPage + 1)}>Next →</a>
                : <span className="outline-pill pagination-disabled">Next →</span>}
            </nav>
          )}
        </>
      ) : (
        <div className="glass-card empty-card">
          <p className="eyebrow">CLEAR SCHEDULE</p>
          <h2>No bookings match these filters</h2>
          <p>Adjust the filters or clear them to see more reservations.</p>
        </div>
      )}
    </section>
  );
}
