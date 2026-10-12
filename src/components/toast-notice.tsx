"use client";

import { useEffect, useState } from "react";

export function ToastNotice({
  message,
  variant,
}: {
  message?: string | null;
  variant: "success" | "error";
}) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;

    const timeout = window.setTimeout(() => setVisible(false), variant === "error" ? 8000 : 5000);
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
        onClick={() => setVisible(false)}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
