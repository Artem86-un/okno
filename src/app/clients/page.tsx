import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { ClientNotesForm } from "@/components/forms/booking-operations";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getDashboardData } from "@/lib/data";

type ClientsPageProps = {
  searchParams: Promise<{
    query?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const data = await getDashboardData();

  if (!data) {
    redirect("/login");
  }

  const { clients, profile } = data;
  const { query = "" } = await searchParams;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredClients = normalizedQuery
    ? clients.filter((client) =>
        [client.name, client.phoneMasked, client.notes].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
    : clients;

  return (
    <SiteShell compact showAccountNotifications>
      <div className="space-y-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge tone="accent">Клиенты</Badge>
            <h1 className="text-4xl font-semibold text-ink">Клиенты и история визитов</h1>
          </div>
        </div>

        <Card className="space-y-5">
          <form className="flex flex-wrap items-end gap-4">
            <div className="min-w-[260px] flex-1">
              <Input
                label="Поиск"
                name="query"
                placeholder="Имя, телефон или заметка"
                defaultValue={query}
              />
            </div>
            <Button type="submit" variant="secondary" className="gap-2">
              <Search size={16} />
              Найти
            </Button>
          </form>
          {filteredClients.length > 0 ? (
            <div className="grid gap-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="rounded-[24px] border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">{client.name}</p>
                      <p className="mt-1 text-sm text-ink-soft">{client.phoneMasked}</p>
                    </div>
                    <p className="text-sm text-muted">
                      Последний визит:{" "}
                      {new Date(client.lastBookingAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <ClientNotesForm clientId={client.id} notes={client.notes} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-line p-5 text-sm leading-6 text-muted">
              По запросу <span className="font-medium text-ink">{query}</span> пока ничего не найдено.
            </div>
          )}
        </Card>

        {clients.length === 0 ? (
          <EmptyState
            title="Новых клиентов пока нет"
            description="После первой реальной записи клиент появится здесь автоматически вместе с историей и заметками."
            ctaLabel="Открыть свою ссылку"
            ctaHref={`/${profile.username}`}
          />
        ) : null}
      </div>
    </SiteShell>
  );
}
