"use client";

import { useActionState } from "react";
import { createBooking, type BookingActionState } from "@/app/actions/bookings";

const initialState: BookingActionState = {};

export function BookingForm({
  resourceId,
  defaultStartAt,
  defaultEndAt,
}: {
  resourceId: string;
  defaultStartAt: string;
  defaultEndAt: string;
}) {
  const [state, action, isPending] = useActionState(createBooking, initialState);

  return (
    <form action={action} className="booking-form">
      <input name="resourceId" type="hidden" value={resourceId} />
      <label>
        <span>Start · Colombo time</span>
        <input defaultValue={defaultStartAt} name="startAt" required type="datetime-local" />
      </label>
      <label>
        <span>End · Colombo time</span>
        <input defaultValue={defaultEndAt} name="endAt" required type="datetime-local" />
      </label>
      <label>
        <span>Purpose <span className="optional-label">Optional</span></span>
        <input maxLength={500} name="purpose" placeholder="What are you using it for?" />
      </label>
      {state.error && <p className="form-error booking-feedback" role="alert">{state.error}</p>}
      {state.success && <p className="form-success booking-feedback" role="status">{state.success}</p>}
      <button className="gradient-button form-submit" disabled={isPending} type="submit">
        {isPending ? "Checking availability…" : "Reserve this resource"}
      </button>
    </form>
  );
}
