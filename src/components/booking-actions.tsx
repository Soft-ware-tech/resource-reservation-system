"use client";

import { cancelBooking, markBookingInUse, returnBooking } from "@/app/actions/bookings";

type BookingAction = "cancel" | "start" | "return";

export function BookingActionForm({
  bookingId,
  action,
  resourceName,
}: {
  bookingId: string;
  action: BookingAction;
  resourceName: string;
}) {
  const label = action === "cancel"
    ? "Cancel booking"
    : action === "start"
      ? "Start using"
      : "Finished using / Return";
  const formAction = action === "cancel"
    ? cancelBooking
    : action === "start"
      ? markBookingInUse
      : returnBooking;

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (action === "cancel" && !window.confirm(`Cancel your booking for ${resourceName}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="bookingId" type="hidden" value={bookingId} />
      <button className={`outline-pill booking-action ${action === "cancel" ? "cancel-action" : ""}`} type="submit">
        {label}
      </button>
    </form>
  );
}
