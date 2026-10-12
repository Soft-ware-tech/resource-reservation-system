"use client";

import { useFormStatus } from "react-dom";
import { deleteResource } from "@/app/actions/resources";

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className="text-button danger-text" disabled={pending} type="submit">{pending ? "Deleting…" : "Delete"}</button>;
}

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
      <DeleteButton />
    </form>
  );
}
