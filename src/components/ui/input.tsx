import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium" style={{ color: "var(--color-ink, #23241f)" }}>
        {label}
      </span>
      <input
        style={{
          borderColor: "var(--color-line, #d3c5b3)",
          backgroundColor: "#ffffff",
          color: "var(--color-ink, #23241f)",
        }}
        className={cn(
          "min-h-12 rounded-2xl border px-4 text-[15px] outline-none transition placeholder:text-[#8b8477]",
          className,
        )}
        {...props}
      />
      {hint ? (
        <span className="text-xs" style={{ color: "var(--color-muted, #656055)" }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
