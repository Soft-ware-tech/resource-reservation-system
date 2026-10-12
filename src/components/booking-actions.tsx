"use client";

import { cancelBooking, markBookingInUse, returnBooking } from "@/app/actions/bookings";
import { useFormStatus } from "react-dom";

type BookingAction = "cancel" | "start" | "return";

function BookingSubmitButton({ action, label }: { action: BookingAction; label: string }) {
  const { pending } = useFormStatus();
  const pendingLabel = action === "cancel" ? "Cancelling…" : action === "start" ? "Starting…" : "Returning…";

  return (
    <button
      className={`outline-pill booking-action ${action === "cancel" ? "cancel-action" : ""}`}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

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
      <BookingSubmitButton action={action} label={label} />
    </form>
  );
}
