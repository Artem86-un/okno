import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import {
  CalendarClock,
  ChartNoAxesColumn,
  Globe,
  MessageCircle,
  Settings2,
  Sparkles,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Booking, Client, Service } from "@/lib/mock-data";
import { getDashboardData } from "@/lib/data";

function pluralizeActiveBookings(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} активная запись`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} активные записи`;
  }

  return `${count} активных записей`;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect("/login");
  }

  const { bookings, clients, notificationEvents, profile, services } = data;
  const remainingBookings = Math.max(
    0,
    profile.monthlyBookingLimit - profile.monthlyBookingsUsed,
  );
  const remainingPercent =
    profile.monthlyBookingLimit > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (remainingBookings / profile.monthlyBookingLimit) * 100,
          ),
        )
      : 0;
  const progressTone =
    remainingPercent > 60
      ? "var(--color-success)"
      : remainingPercent > 25
        ? "var(--color-warning)"
        : "#c96b5c";
  const now = DateTime.now().setZone(profile.timezone);
  const todayKey = now.toFormat("yyyy-MM-dd");
  const todayBookings = bookings.filter(
    (booking) =>
      DateTime.fromISO(booking.startsAt, { zone: "utc" })
        .setZone(profile.timezone)
        .toFormat("yyyy-MM-dd") === todayKey,
  );
  const futureBookings = bookings.filter(
    (booking) =>
      DateTime.fromISO(booking.startsAt, { zone: "utc" })
        .setZone(profile.timezone)
        .toFormat("yyyy-MM-dd") !== todayKey,
  );

  return (
    <SiteShell compact>
      <div className="space-y-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge tone="accent">Кабинет мастера</Badge>
            <h1 className="text-4xl font-semibold text-[var(--color-ink)]">
              Добрый день, {profile.fullName}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--color-ink-soft)]">
              Сегодня у тебя {pluralizeActiveBookings(todayBookings.length)}. Внизу все ближайшие визиты и
              быстрые действия по кабинету.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="space-y-2">
                <CalendarClock className="text-[var(--color-accent-deep)]" size={22} />
                <p className="text-sm text-[var(--color-muted)]">Записи сегодня</p>
                <p className="text-3xl font-semibold text-[var(--color-ink)]">{todayBookings.length}</p>
              </Card>
              <Card className="space-y-2">
                <ChartNoAxesColumn className="text-[var(--color-warning)]" size={22} />
                <p className="text-sm text-[var(--color-muted)]">Осталось в тарифе</p>
                <p className="text-3xl font-semibold text-[var(--color-ink)]">
                  {remainingBookings}
                </p>
              </Card>
              <Card className="space-y-2">
                <MessageCircle className="text-[var(--color-success)]" size={22} />
                <p className="text-sm text-[var(--color-muted)]">Уведомления</p>
                <p className="text-3xl font-semibold text-[var(--color-ink)]">
                  {notificationEvents.length}
                </p>
              </Card>
            </div>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Ближайшие записи</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Сначала показываем визиты на сегодня, потом все остальные по датам.
                  </p>
                </div>
                <ButtonLink href="/schedule" variant="secondary">
                  Открыть расписание
                </ButtonLink>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)]">Сегодня</h3>
                    <span className="text-sm text-[var(--color-muted)]">
                      {now.setLocale("ru").toFormat("d LLLL")}
                    </span>
                  </div>
                  {todayBookings.length > 0 ? (
                    <div className="space-y-3">
                      {todayBookings.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          clients={clients}
                          services={services}
                          timezone={profile.timezone}
                          showDate={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[var(--color-line)] p-5 text-sm text-[var(--color-muted)]">
                      На сегодня записей пока нет.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">Другие дни</h3>
                  {futureBookings.length > 0 ? (
                    <div className="space-y-3">
                      {futureBookings.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          clients={clients}
                          services={services}
                          timezone={profile.timezone}
                          showDate
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[var(--color-line)] p-5 text-sm text-[var(--color-muted)]">
                      Записей на другие дни пока нет.
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <EmptyState
              title="Быстрый доступ к своей странице"
              description="Проверь, как выглядит запись для клиента, и при необходимости сразу подправь расписание или услуги."
              ctaLabel="Открыть публичную страницу"
              ctaHref={`/${profile.username}`}
            />
          </div>

          <div className="space-y-6">
            <Card
              className="space-y-4 border-transparent text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-ink) 0%, #35362f 100%)",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <p className="text-sm uppercase tracking-[0.24em] text-white/60">
                  Остаток тарифа
                </p>
              </div>
              <p className="text-4xl font-semibold text-white">
                {remainingBookings} записи
              </p>
              <p className="text-sm leading-7 text-white/70">
                Из {profile.monthlyBookingLimit} бесплатных записей в этом месяце использовано{" "}
                {profile.monthlyBookingsUsed}. Переход на Pro можно показать заранее и без
                навязчивости.
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                Осталось {Math.round(remainingPercent)}% лимита
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${remainingPercent}%`,
                    background: progressTone,
                  }}
                />
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
                  Быстрые действия
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Полезные шаги, которые можно сделать прямо сейчас.
                </p>
              </div>
              <div className="space-y-3">
                <QuickAction
                  icon={<Settings2 size={18} className="text-[var(--color-accent-deep)]" />}
                  title="Проверить параметры записи"
                  description="Окно записи, шаг времени и буфер между клиентами."
                  href="/settings"
                  ctaLabel="Открыть настройки"
                  statusLabel="Важно"
                  statusTone="accent"
                />
                <QuickAction
                  icon={<MessageCircle size={18} className="text-[var(--color-success)]" />}
                  title="Подключить Telegram"
                  description={
                    profile.telegramChatId
                      ? "Telegram уже подключен, уведомления можно получать сразу."
                      : "Чтобы быстрее узнавать о новых визитах и изменениях."
                  }
                  href="/settings"
                  ctaLabel={profile.telegramChatId ? "Проверить подключение" : "Подключить"}
                  statusLabel={profile.telegramChatId ? "Готово" : "Не подключено"}
                  statusTone={profile.telegramChatId ? "success" : "warning"}
                />
                <QuickAction
                  icon={<Globe size={18} className="text-[var(--color-warning)]" />}
                  title="Открыть публичную страницу"
                  description="Посмотри, как запись выглядит для клиента с телефона."
                  href={`/${profile.username}`}
                  ctaLabel="Открыть страницу"
                  statusLabel="Проверка"
                  statusTone="neutral"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
  ctaLabel,
  statusLabel,
  statusTone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  statusLabel: string;
  statusTone: "neutral" | "success" | "accent" | "warning";
}) {
  return (
    <div className="rounded-[22px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-3">
            {icon}
            <p className="font-medium text-[var(--color-ink)]">{title}</p>
          </div>
          <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
            {description}
          </p>
        </div>
        <Badge tone={statusTone}>{statusLabel}</Badge>
      </div>
      <div className="mt-4">
        <ButtonLink href={href} variant="secondary">
          {ctaLabel}
        </ButtonLink>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  clients,
  services,
  timezone,
  showDate,
}: {
  booking: Booking;
  clients: Client[];
  services: Service[];
  timezone: string;
  showDate: boolean;
}) {
  const service = services.find((item) => item.id === booking.serviceId);
  const client = clients.find((item) => item.id === booking.clientId);
  const startsAt = DateTime.fromISO(booking.startsAt, { zone: "utc" }).setZone(
    timezone,
  );

  return (
    <div className="w-full max-w-full overflow-hidden rounded-[24px] border border-[var(--color-line)] p-4">
      <div className="flex w-full max-w-full flex-wrap items-start justify-between gap-4 overflow-hidden">
        <div className="min-w-0 flex-1 basis-full space-y-1 sm:basis-0">
          <p className="font-medium text-[var(--color-ink)]">{client?.name}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {service?.title} • {startsAt.toFormat("HH:mm")}
          </p>
          {showDate ? (
            <p className="text-sm text-[var(--color-muted)]">
              Дата визита: {startsAt.setLocale("ru").toFormat("d LLLL")}
            </p>
          ) : null}
          {booking.clientNote ? (
            <p
              className="max-w-full overflow-hidden whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]"
              style={{
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              Комментарий клиента: {booking.clientNote}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <Badge tone="success">Подтверждено</Badge>
        </div>
      </div>
    </div>
  );
}
