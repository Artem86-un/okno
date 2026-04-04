import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[var(--color-ink)]">{label}</span>
      <input
        className={cn(
          "min-h-12 rounded-2xl border border-[var(--color-line)] bg-white px-4 text-[15px] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}
