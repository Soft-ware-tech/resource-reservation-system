"use client";

import { deleteResource } from "@/app/actions/resources";

export function ResourceDeleteForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteResource}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${name}"? Resources with bookings cannot be deleted.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="text-button danger-text" type="submit">Delete</button>
    </form>
  );
}
