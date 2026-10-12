"use client";

import { useEffect, useState } from "react";

export function ToastNotice({
  message,
  variant,
}: {
  message?: string | null;
  variant: "success" | "error";
}) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const visible = Boolean(message) && dismissedMessage !== message;

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => setDismissedMessage(message), variant === "error" ? 8000 : 5000);
    return () => window.clearTimeout(timeout);
  }, [message, variant]);

  if (!message || !visible) return null;

  return (
    <div
      className={`toast-notice toast-${variant}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <span>{message}</span>
      <button
        aria-label="Dismiss notification"
        className="toast-dismiss"
        onClick={() => setDismissedMessage(message ?? null)}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
