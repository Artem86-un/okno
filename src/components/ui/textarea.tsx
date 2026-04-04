import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function Textarea({ label, hint, className, ...props }: TextareaProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[var(--color-ink)]">{label}</span>
      <textarea
        className={cn(
          "min-h-28 rounded-3xl border border-[var(--color-line)] bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}
