export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--color-muted)]">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
        {description}
      </p>
    </div>
  );
}
