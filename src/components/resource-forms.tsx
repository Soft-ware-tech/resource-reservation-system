"use client";

import { useActionState } from "react";
import { deleteCategory, saveCategory, saveResource, type ResourceActionState } from "@/app/actions/resources";
import { ToastNotice } from "@/components/toast-notice";

const initialState: ResourceActionState = {};

function Feedback({ state }: { state: ResourceActionState }) {
  const message = state.error ?? state.success;
  return <ToastNotice message={message} variant={state.error ? "error" : "success"} />;
}

export function CategoryForm({
  category,
}: {
  category?: { id: string; name: string; description: string | null };
}) {
  const [state, action, isPending] = useActionState(saveCategory, initialState);
  return (
    <form action={action} className="resource-form">
      {category && <input name="id" type="hidden" value={category.id} />}
      <label>
        <span>Category name</span>
        <input defaultValue={category?.name} maxLength={60} name="name" placeholder="e.g. Rooms" required />
      </label>
      <label>
        <span>Description <span className="optional-label">Optional</span></span>
        <textarea defaultValue={category?.description ?? ""} maxLength={2000} name="description" rows={2} />
      </label>
      <Feedback state={state} />
      <button className="gradient-button form-submit" disabled={isPending} type="submit">
        {isPending ? "Saving…" : category ? "Save category" : "Add category"}
      </button>
    </form>
  );
}

export function CategoryDeleteForm({ id, name }: { id: string; name: string }) {
  const [state, action, isPending] = useActionState(deleteCategory, initialState);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${name}"? Categories with resources cannot be deleted.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="text-button danger-text" disabled={isPending} type="submit">
        {isPending ? "Deleting…" : "Delete"}
      </button>
      <ToastNotice message={state.error ?? state.success} variant={state.error ? "error" : "success"} />
    </form>
  );
}

export function ResourceForm({
  categories,
  resource,
}: {
  categories: { id: string; name: string }[];
  resource?: {
    id: string;
    name: string;
    categoryId: string;
    description: string | null;
    details: string | null;
    imageUrl: string | null;
    active: boolean;
  };
}) {
  const [state, action, isPending] = useActionState(saveResource, initialState);
  return (
    <form action={action} className="resource-form">
      {resource && <input name="id" type="hidden" value={resource.id} />}
      <label>
        <span>Resource name</span>
        <input defaultValue={resource?.name} maxLength={100} name="name" placeholder="e.g. Innovation Room" required />
      </label>
      <label>
        <span>Category</span>
        <select defaultValue={resource?.categoryId ?? ""} name="categoryId" required>
          <option disabled value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Description <span className="optional-label">Optional</span></span>
        <textarea defaultValue={resource?.description ?? ""} maxLength={2000} name="description" rows={2} />
      </label>
      <label>
        <span>Capacity or details <span className="optional-label">Optional</span></span>
        <input defaultValue={resource?.details ?? ""} maxLength={300} name="details" placeholder="e.g. Seats 10" />
      </label>
      <label>
        <span>Image URL <span className="optional-label">Optional</span></span>
        <input defaultValue={resource?.imageUrl ?? ""} maxLength={2048} name="imageUrl" placeholder="https://…" type="url" />
      </label>
      <label className="checkbox-label">
        <input defaultChecked={resource?.active ?? true} name="active" type="checkbox" value="true" />
        <span>Active and visible to users</span>
      </label>
      <Feedback state={state} />
      <button className="gradient-button form-submit" disabled={isPending} type="submit">
        {isPending ? "Saving…" : resource ? "Save resource" : "Add resource"}
      </button>
    </form>
  );
}
