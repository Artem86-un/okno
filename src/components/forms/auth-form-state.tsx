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
      className={`inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-ink-soft)] disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
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
      className={`rounded-2xl px-4 py-3 text-sm ${
        success
          ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
          : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
      }`}
    >
      {message}
    </p>
  );
}
