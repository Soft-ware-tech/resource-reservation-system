"use client";

import { adminCancelBooking, adminReturnBooking, setUserActive } from "@/app/actions/admin";

export function AdminBookingAction({
  bookingId,
  resourceName,
  action,
}: {
  bookingId: string;
  resourceName: string;
  action: "cancel" | "return";
}) {
  const isCancel = action === "cancel";
  const formAction = isCancel ? adminCancelBooking : adminReturnBooking;
  const label = isCancel ? "Cancel booking" : "Mark returned";

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmation = isCancel
          ? `Cancel ${resourceName}'s reservation?`
          : `Mark ${resourceName} as returned and available?`;
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
    >
      <input name="bookingId" type="hidden" value={bookingId} />
      <button className={`outline-pill booking-action${isCancel ? " cancel-action" : ""}`} type="submit">
        {label}
      </button>
    </form>
  );
}

export function UserActiveToggle({ userId, active }: { userId: string; active: boolean }) {
  const nextActive = !active;

  return (
    <form
      action={setUserActive}
      onSubmit={(event) => {
        if (!nextActive && !window.confirm("Deactivate this account? The user will no longer be able to sign in.")) {
          event.preventDefault();
        }
      }}
    >
      <input name="userId" type="hidden" value={userId} />
      <input name="active" type="hidden" value={String(nextActive)} />
      <button
        className={`outline-pill booking-action${active ? " cancel-action" : ""}`}
        type="submit"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
    </form>
  );
}
