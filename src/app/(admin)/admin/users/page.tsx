import type { Metadata } from "next";
import { createManagedUser } from "@/app/actions/admin";
import { UserActiveToggle } from "@/components/admin-actions";
import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Manage users | PrimeWave Reserve" };
export const instant = false;

type PageProps = { searchParams: Promise<{ success?: string; error?: string }> };

export default async function ManageUsersPage({ searchParams }: PageProps) {
  const [, users, query] = await Promise.all([
    requireRole("ADMIN"),
    prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    searchParams,
  ]);
  const notice = query.success === "activated"
    ? "User account activated."
    : query.success === "created"
      ? "New user account created."
    : query.success === "deactivated"
      ? "User account deactivated. Their access has been removed."
      : query.error === "self"
        ? "You cannot deactivate your own admin account."
        : query.error === "duplicate"
          ? "An account with that email address already exists."
          : query.error === "invalid-fields"
            ? "Enter a name, valid email address, and password with at least 8 characters."
        : query.error === "missing"
          ? "That user account no longer exists."
          : query.error
            ? "The user account could not be updated."
            : null;

  return (
    <section className="management-section">
      <p className="eyebrow">ADMIN · PEOPLE</p>
      <div className="section-heading-row">
        <div>
          <h1 className="display-heading">Your team, <span className="gradient-text">connected.</span></h1>
          <p className="welcome-copy">Review user accounts and control who can access the reservation workspace.</p>
        </div>
        <span className="count-pill">{users.length} users</span>
      </div>
      {notice && <p className={query.error ? "form-error page-notice" : "form-success page-notice"} role="status">{notice}</p>}
      {users.length ? (
        <div className="management-grid admin-users-layout">
          <section className="glass-card management-panel">
            <p className="eyebrow">CREATE A USER</p>
            <h2>Invite a teammate</h2>
            <p className="welcome-copy">Set an initial password and share the sign-in details through a secure channel.</p>
            <form action={createManagedUser} className="resource-form">
              <label>
                <span>Full name</span>
                <input autoComplete="name" maxLength={100} minLength={2} name="name" required />
              </label>
              <label>
                <span>Email address</span>
                <input autoComplete="email" maxLength={254} name="email" required type="email" />
              </label>
              <label>
                <span>Temporary password</span>
                <input autoComplete="new-password" maxLength={128} minLength={8} name="password" required type="password" />
              </label>
              <p className="admin-password-hint">Use at least 8 characters and share the temporary password securely.</p>
              <button className="gradient-button form-submit" type="submit">Create user account</button>
            </form>
          </section>
          <section aria-label="User accounts" className="admin-user-list">
            {users.map((user) => (
              <article className="glass-card admin-user-card" key={user.id}>
                <span aria-hidden="true" className={`admin-user-avatar${user.active ? "" : " user-inactive-avatar"}`}>
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="admin-user-details">
                  <h2>{user.name}</h2>
                  <a href={`mailto:${user.email}`}>{user.email}</a>
                  <span>{user._count.bookings} {user._count.bookings === 1 ? "booking" : "bookings"} · Joined {user.createdAt.toLocaleDateString("en-LK", { timeZone: "Asia/Colombo", dateStyle: "medium" })}</span>
                </div>
                <span className={`availability-badge ${user.active ? "available-badge" : "inactive-badge"}`}>
                  {user.active ? "Active account" : "Access suspended"}
                </span>
                <UserActiveToggle active={user.active} userId={user.id} />
              </article>
            ))}
          </section>
        </div>
      ) : (
        <div className="glass-card empty-card">
          <p className="eyebrow">A SMALL TEAM SO FAR</p>
          <h2>No user accounts yet</h2>
          <p>Newly registered reservation users will appear here.</p>
        </div>
      )}
    </section>
  );
}
