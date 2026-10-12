"use client";

import { adminCancelBooking, adminReturnBooking, setUserActive } from "@/app/actions/admin";
import { useFormStatus } from "react-dom";

function AdminBookingSubmitButton({ action }: { action: "cancel" | "return" }) {
  const { pending } = useFormStatus();
  const label = action === "cancel" ? "Cancel booking" : "Mark returned";
  const pendingLabel = action === "cancel" ? "Cancelling…" : "Marking returned…";

  return (
    <button className={`outline-pill booking-action${action === "cancel" ? " cancel-action" : ""}`} disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}

function UserActiveSubmitButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={`outline-pill booking-action${active ? " cancel-action" : ""}`}
      disabled={pending}
      type="submit"
    >
      {pending ? (active ? "Deactivating…" : "Activating…") : active ? "Deactivate" : "Activate"}
    </button>
  );
}

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
      <AdminBookingSubmitButton action={action} />
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
      <UserActiveSubmitButton active={active} />
    </form>
  );
}
