"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      style={{
        backgroundColor: "var(--color-ink, #23241f)",
        color: "#ffffff",
      }}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
      disabled={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function FormMessage({
  message,
  success = false,
}: {
  message?: string;
  success?: boolean;
}) {
  if (!message) return null;

  return (
    <p
      style={
        success
          ? {
              backgroundColor: "var(--color-success-soft, #e6f3eb)",
              color: "var(--color-success, #3f7b5a)",
            }
          : {
              backgroundColor: "var(--color-warning-soft, #f5ecdb)",
              color: "var(--color-warning, #8e6c2f)",
            }
      }
      className="rounded-2xl px-4 py-3 text-sm"
    >
      {message}
    </p>
  );
}
