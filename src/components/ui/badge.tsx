import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "accent" | "warning";
}) {
  const tones = {
    neutral: "bg-[var(--color-panel)] text-[var(--color-ink-soft)]",
    success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]",
    warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
