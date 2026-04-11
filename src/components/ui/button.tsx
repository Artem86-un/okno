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
  primary: {
    backgroundColor: "var(--color-ink, #23241f)",
    color: "#ffffff",
    border: "1px solid transparent",
  },
  secondary: {
    backgroundColor: "#ffffff",
    color: "var(--color-ink, #23241f)",
    border: "1px solid var(--color-line, #d3c5b3)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-ink, #23241f)",
    border: "1px solid transparent",
  },
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type ?? "button"}
      style={styles[variant]}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none",
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
      style={styles[variant]}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
