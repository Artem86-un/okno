type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  options: SelectOption[];
};

export function Select({ label, hint, options, ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[var(--color-ink)]">{label}</span>
      <select
        className="min-h-12 rounded-2xl border border-[var(--color-line)] bg-white px-4 text-[15px] text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}
