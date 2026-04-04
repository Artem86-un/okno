import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const styles = {
  primary:
    "bg-[var(--color-ink)] text-white hover:-translate-y-0.5 hover:bg-[var(--color-ink-soft)] active:scale-[0.98]",
  secondary:
    "bg-white text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:-translate-y-0.5 hover:bg-[var(--color-panel)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-panel)] active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type ?? "button"}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
