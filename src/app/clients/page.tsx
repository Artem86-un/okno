import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getDashboardData } from "@/lib/data";

export default async function ClientsPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect("/login");
  }

  const { clients, profile } = data;

  return (
    <SiteShell compact>
      <div className="space-y-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge tone="accent">Клиенты</Badge>
            <h1 className="text-4xl font-semibold text-[var(--color-ink)]">Клиенты и история визитов</h1>
          </div>
        </div>

        <Card className="space-y-5">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Input label="Поиск" placeholder="Имя или телефон" />
            </div>
            <div className="mb-1 hidden h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-line)] sm:flex">
              <Search size={18} className="text-[var(--color-muted)]" />
            </div>
          </div>
          <div className="grid gap-4">
            {clients.map((client) => (
              <div key={client.id} className="rounded-[24px] border border-[var(--color-line)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{client.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{client.phoneMasked}</p>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">
                    Последний визит:{" "}
                    {new Date(client.lastBookingAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{client.notes}</p>
              </div>
            ))}
          </div>
        </Card>

        <EmptyState
          title="Новых клиентов пока нет"
          description="После первой реальной записи клиент появится здесь автоматически вместе с историей и заметками."
          ctaLabel="Открыть свою ссылку"
          ctaHref={`/${profile.username}`}
        />
      </div>
    </SiteShell>
  );
}
