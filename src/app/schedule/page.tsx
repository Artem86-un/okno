import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { Lock, Rows3 } from "lucide-react";
import { BlockedSlotsForm } from "@/components/forms/blocked-slots-form";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardData } from "@/lib/data";

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default async function SchedulePage() {
  const data = await getDashboardData();

  if (!data) {
    redirect("/login");
  }

  const { availabilityRules, blockedSlots, bookings, profile } = data;

  return (
    <SiteShell compact>
      <div className="space-y-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge tone="accent">Расписание</Badge>
            <h1 className="text-4xl font-semibold text-[var(--color-ink)]">Расписание и блокировки</h1>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-4">
            <div className="inline-flex w-fit rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] p-1">
              <button className="rounded-full bg-white px-4 py-2 text-sm text-[var(--color-ink)] shadow-sm">
                День
              </button>
              <button className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)]">
                Неделя
              </button>
              <button className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)]">
                Месяц
              </button>
            </div>
            <div className="grid gap-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-[24px] border border-[var(--color-line)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">
                        {new Date(booking.startsAt).toLocaleDateString("ru-RU", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                        {new Date(booking.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(booking.endsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge tone="success">Занято</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <Rows3 size={18} className="text-[var(--color-accent-deep)]" />
                <h2 className="text-xl font-semibold text-[var(--color-ink)]">Рабочие часы</h2>
              </div>
              <div className="space-y-3">
                {availabilityRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-[20px] bg-[var(--color-panel)] px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{weekdays[rule.weekday - 1]}</p>
                    <p className="text-sm text-[var(--color-ink-soft)]">
                      {rule.startTime} - {rule.endTime}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-[var(--color-warning)]" />
                <h2 className="text-xl font-semibold text-[var(--color-ink)]">Ручные блокировки</h2>
              </div>
              <BlockedSlotsForm
                blockedSlots={blockedSlots}
                timezone={profile.timezone}
                defaultDate={DateTime.now().setZone(profile.timezone).toISODate() ?? ""}
              />
            </Card>

            <EmptyState
              title="Если расписания пока нет"
              description="Новый мастер чаще всего сначала видит пустой экран. Здесь важно не пугать, а сразу вести к настройке рабочих часов."
              ctaLabel="Настроить рабочие часы"
              ctaHref="/settings"
            />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
