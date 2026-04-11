import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <Card className="bg-panel">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <p className="max-w-xl text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
        <ButtonLink href={ctaHref} variant="secondary" className="w-fit gap-2">
          {ctaLabel}
          <ArrowRight size={16} />
        </ButtonLink>
      </div>
    </Card>
  );
}
