import { CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ConfirmPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    service?: string;
    date?: string;
    time?: string;
    name?: string;
    phone?: string;
  }>;
};

export default async function ConfirmPage({
  params,
  searchParams,
}: ConfirmPageProps) {
  const { username } = await params;
  const query = await searchParams;

  return (
    <SiteShell compact hideGuestMenu>
      <div className="mx-auto max-w-3xl py-10">
        <Card className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-soft)]">
            <CheckCircle2 size={28} className="text-[var(--color-success)]" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-[var(--color-ink)]">Запись подтверждена</h1>
            <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
              {query.name || "Клиент"}, запись принята. Сохрани это время, чтобы не потерять его.
            </p>
          </div>
          <div className="rounded-[28px] bg-[var(--color-panel)] p-5 text-left">
            <p className="font-medium text-[var(--color-ink)]">{query.service || "Услуга"}</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              {query.date || "Дата"} • {query.time || "Время"}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href={`/${username}`}>Вернуться к мастеру</ButtonLink>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
