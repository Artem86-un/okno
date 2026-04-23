"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Clock3,
  MapPin,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { getBookingThemeStyle } from "@/lib/booking-theme-presets";
import { formatCurrency, type BookingSlot, type Profile, type Service } from "@/lib/mock-data";

type PublicProfileViewProps = {
  profile: Profile;
  services: Service[];
  bookingSlotsByService: Record<string, BookingSlot[]>;
  bookingHref: string;
  eyebrowLabel: string;
  showDemoSections?: boolean;
  guidedDemo?: boolean;
  guidedDemoCleanHref?: string;
};

type DemoStoryStep = {
  id: string;
  stepLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  settings: string;
  tone?: "light" | "accent" | "ink";
};

function capitalizeLabel(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatSlotDate(date: string) {
  return capitalizeLabel(
    DateTime.fromISO(date, { zone: "utc" }).setLocale("ru").toFormat("ccc, d LLL"),
  );
}

function getClosestSlots(
  services: Service[],
  bookingSlotsByService: Record<string, BookingSlot[]>,
) {
  const serviceMap = new Map(services.map((service) => [service.id, service]));

  return Object.entries(bookingSlotsByService)
    .flatMap(([serviceId, slots]) =>
      slots.flatMap((slot) =>
        slot.times.slice(0, 2).map((time) => ({
          serviceId,
          serviceTitle: serviceMap.get(serviceId)?.title ?? "Услуга",
          date: slot.value,
          dateLabel: formatSlotDate(slot.value),
          time,
          sortKey: `${slot.value}T${time}`,
        })),
      ),
    )
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .slice(0, 4);
}

function PortfolioModal({
  fullName,
  works,
  isOpen,
  onClose,
}: {
  fullName: string;
  works: Profile["portfolioWorks"];
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || works.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 px-3 py-5 sm:px-6 sm:py-8"
      style={{ backgroundColor: "rgba(25,26,23,0.3)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Галерея работ ${fullName}`}
        className="mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-line shadow-[0_40px_120px_rgba(22,24,20,0.18)]"
        style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              Готовые работы
            </p>
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{fullName}</h2>
            <p className="text-sm leading-6 text-ink-soft">
              Можно спокойно пролистать всю подборку, не уходя со страницы записи.
            </p>
          </div>
          <Button variant="secondary" onClick={onClose} className="px-4">
            Закрыть
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {works.map((work, index) => (
              <article
                key={work.id}
                className="overflow-hidden rounded-[28px] border border-line"
                style={{ backgroundColor: "var(--color-panel)" }}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={work.imageUrl}
                    alt={`${fullName}, работа ${index + 1}`}
                    fill
                    sizes="(max-width: 639px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="px-4 py-4">
                  <p className="text-sm font-medium text-ink">Работа {index + 1}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoStoryIntro({
  steps,
}: {
  steps: DemoStoryStep[];
}) {
  return (
    <section className="mb-10 overflow-hidden rounded-[40px] border border-white/80 bg-white/78 shadow-[0_32px_120px_rgba(35,36,31,0.08)] backdrop-blur">
      <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
            Scroll Story
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Прокрути страницу так, как будто ты клиент, а пояснения будут идти прямо по ходу экрана
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {steps.slice(0, 2).map((step) => (
            <div
              key={step.id}
              className="rounded-[28px] border border-line bg-[rgba(250,248,244,0.8)] p-4"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                {step.stepLabel}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{step.eyebrow}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoStoryChapter({
  step,
}: {
  step: DemoStoryStep;
}) {
  const toneClasses =
    step.tone === "ink"
      ? {
          shell: "border-transparent bg-[linear-gradient(145deg,#23241f_0%,#343730_100%)] text-white shadow-[0_30px_90px_rgba(35,36,31,0.18)]",
          eyebrow: "text-white/60",
          description: "text-white/75",
          settings: "border-white/10 bg-white/8 text-white/75",
          settingsLabel: "text-white/55",
        }
      : step.tone === "accent"
        ? {
            shell: "border-accent bg-[rgba(238,247,240,0.9)] text-ink shadow-[0_24px_80px_rgba(35,36,31,0.08)]",
            eyebrow: "text-accent-deep",
            description: "text-ink-soft",
            settings: "border-white/70 bg-white/78 text-ink-soft",
            settingsLabel: "text-muted",
          }
        : {
            shell: "border-white/80 bg-white/74 text-ink shadow-[0_24px_80px_rgba(35,36,31,0.08)]",
            eyebrow: "text-muted",
            description: "text-ink-soft",
            settings: "border-line bg-panel text-ink-soft",
            settingsLabel: "text-muted",
          };

  return (
    <section className="mt-12">
      <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)] xl:items-start">
        <div className="space-y-3 xl:sticky xl:top-24">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
            {step.stepLabel}
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {step.eyebrow}
          </h3>
        </div>

        <div className={`rounded-[36px] border p-6 sm:p-8 ${toneClasses.shell}`}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {step.title}
              </h3>
              <p className={`text-base leading-8 sm:text-lg ${toneClasses.description}`}>
                {step.description}
              </p>
            </div>

            <div className={`rounded-[28px] border p-5 ${toneClasses.settings}`}>
              <p className={`text-[11px] uppercase tracking-[0.18em] ${toneClasses.settingsLabel}`}>
                Что настраивает мастер
              </p>
              <p className="mt-3 text-sm leading-7">{step.settings}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoStoryOutro({
  cleanHref,
}: {
  cleanHref?: string;
}) {
  return (
    <section className="mt-16 rounded-[40px] border border-white/80 bg-white/78 px-6 py-7 shadow-[0_24px_80px_rgba(35,36,31,0.08)] backdrop-blur sm:px-8 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
            Финал
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Дальше можно посмотреть тот же профиль уже без пояснений
          </h3>
          <p className="max-w-2xl text-base leading-7 text-ink-soft sm:text-lg">
            Это тот же самый demo-профиль, только без story-блоков. Так проще оценить, как страница
            выглядит сама по себе и насколько она готова к отправке клиенту.
          </p>
        </div>

        {cleanHref ? (
          <ButtonLink
            href={cleanHref}
            documentNavigation
            variant="secondary"
            className="justify-center gap-2"
          >
            Открыть чистый профиль
            <ArrowRight size={16} />
          </ButtonLink>
        ) : null}
      </div>
    </section>
  );
}

export function PublicProfileView({
  profile,
  services,
  bookingSlotsByService,
  bookingHref,
  eyebrowLabel,
  showDemoSections = true,
  guidedDemo = false,
  guidedDemoCleanHref,
}: PublicProfileViewProps) {
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const closestSlots = getClosestSlots(services, bookingSlotsByService);
  const hasPortfolioWorks = profile.portfolioWorks.length > 0;
  const startingPrice =
    services.length > 0 ? Math.min(...services.map((service) => service.price)) : null;
  const shortestDuration =
    services.length > 0 ? Math.min(...services.map((service) => service.durationMinutes)) : null;

  const trustItems = [
    {
      icon: MessageCircleHeart,
      label: "Подтверждение на экране и SMS после записи",
    },
    {
      icon: ShieldCheck,
      label: "Правила записи и отмены мастер настраивает сам",
    },
    {
      icon: Sparkles,
      label: "Локация, услуги и окно записи обновляются в кабинете",
    },
  ];

  const infoItems = [
    {
      icon: CalendarClock,
      title: "Как проходит запись",
      text: "Сначала выбирается услуга и удобное время, затем остаётся только оставить имя и телефон для подтверждения.",
    },
    {
      icon: BadgeCheck,
      title: "Что получает клиент",
      text: "Клиент видит актуальные слоты, подтверждает запись в пару шагов и сразу получает экран с деталями визита.",
    },
    {
      icon: Clock3,
      title: "Что настраивает мастер",
      text: "В кабинете можно менять окно записи, шаг слотов, паузу между визитами, правила самостоятельной отмены и напоминания.",
    },
  ];
  const publicThemeStyle = getBookingThemeStyle(profile.bookingThemePresetId);

  const demoStorySteps: DemoStoryStep[] = [
    {
      id: "hero",
      stepLabel: "Шаг 1",
      eyebrow: "Первая сцена",
      title: "Клиент сразу попадает на личную витрину мастера",
      description:
        "С первого экрана видно имя мастера, нишу, район, аккуратный оффер и кнопки действия. Не нужно сначала разбираться в сервисе или искать, куда нажимать.",
      settings:
        "Имя, фото, описание, специализация и локация меняются в профиле мастера и сразу обновляют публичную страницу.",
      tone: "light",
    },
    {
      id: "slots",
      stepLabel: "Шаг 2",
      eyebrow: "Свободные окна",
      title: "На первом экране сразу есть ответ на вопрос «когда можно записаться?»",
      description:
        "Ближайшие слоты выводятся рядом с витриной мастера, поэтому клиенту не нужно идти в переписку или ждать ответа, чтобы понять, есть ли свободное время.",
      settings:
        "Окно записи, шаг слотов и пауза между визитами задаются в настройках записи, поэтому расписание всегда подчиняется правилам мастера.",
      tone: "accent",
    },
    {
      id: "works",
      stepLabel: "Шаг 3",
      eyebrow: "Работы",
      title: "Портфолио помогает почувствовать стиль мастера без лишних переходов",
      description:
        "Подборка работ встроена прямо в страницу записи. Клиент может быстро понять стиль, уровень и атмосферу, а при желании открыть всю галерею крупнее.",
      settings:
        "Мастер сам загружает фотографии и управляет порядком работ в кабинете, поэтому портфолио всегда остаётся актуальным.",
      tone: "light",
    },
    {
      id: "services",
      stepLabel: "Шаг 4",
      eyebrow: "Услуги",
      title: "Каталог услуг коротко объясняет визит и не перегружает клиента деталями",
      description:
        "Каждая услуга сразу показывает длительность, цену и короткое описание. Этого достаточно, чтобы спокойно выбрать визит и не зависнуть в уточнениях.",
      settings:
        "Названия, описания, длительность, цена и порядок карточек полностью управляются в кабинете мастера.",
      tone: "accent",
    },
    {
      id: "rules",
      stepLabel: "Шаг 5",
      eyebrow: "Правила записи",
      title: "Нижний блок снимает вопросы о локации, отмене и уведомлениях",
      description:
        "В финале страницы клиент понимает, как проходит запись, что будет после бронирования и какие правила действуют без дополнительных сообщений мастеру.",
      settings:
        "Самостоятельная отмена, напоминания клиенту и мастеру, а также остальные параметры записи задаются мастером в настройках.",
      tone: "ink",
    },
  ];

  return (
    <main
      style={publicThemeStyle}
      className="relative min-h-screen overflow-x-hidden bg-[var(--color-background)] pb-28"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, var(--public-glow-a), transparent 30%), radial-gradient(circle at 85% 15%, var(--public-glow-b), transparent 22%), radial-gradient(circle at bottom right, var(--public-glow-c), transparent 30%)",
        }}
      />

      <div
        className={[
          "relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8",
        ].join(" ")}
      >
        <header className="sticky top-4 z-30 mb-8">
          <div
            className="flex items-center justify-between gap-4 rounded-full border px-4 py-3 shadow-[0_18px_50px_rgba(35,36,31,0.08)] backdrop-blur"
            style={{
              backgroundColor: "var(--public-surface-strong)",
              borderColor: "var(--public-edge)",
            }}
          >
            <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-ink">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                o
              </span>
              okno
            </Link>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-panel px-4 py-2 text-sm text-ink-soft">
                <MapPin size={16} />
                {profile.locationText}
              </span>
              <ButtonLink
                href={bookingHref}
                documentNavigation={guidedDemo}
                className="gap-2"
              >
                Записаться
                <ArrowRight size={16} />
              </ButtonLink>
            </div>
          </div>
        </header>

        {guidedDemo ? <DemoStoryIntro steps={demoStorySteps} /> : null}

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div
            data-demo-id="hero"
            className="space-y-6 rounded-[36px] border p-6 shadow-[0_32px_120px_rgba(35,36,31,0.08)] backdrop-blur sm:p-8 lg:p-10"
            style={{
              backgroundColor: "var(--public-surface)",
              borderColor: "var(--public-edge)",
            }}
          >
            <div className="space-y-4">
              <Badge tone="accent">{eyebrowLabel}</Badge>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-6">
                  <h1 className="min-w-0 flex-1 text-5xl font-semibold tracking-[-0.04em] text-ink sm:text-6xl">
                    {profile.fullName}
                  </h1>
                  <div className="shrink-0 overflow-hidden rounded-full border border-white/90 bg-panel shadow-[0_14px_36px_rgba(35,36,31,0.12)]">
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      width={88}
                      height={88}
                      priority
                      loading="eager"
                      className="h-[72px] w-[72px] object-cover sm:h-[88px] sm:w-[88px]"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-base text-ink-soft sm:text-lg">
                  <span>{profile.specialty}</span>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-[var(--color-line)] sm:block" />
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={17} />
                    {profile.locationText}
                  </span>
                </div>
              </div>
              <p className="max-w-2xl text-base leading-8 text-ink-soft sm:text-lg">
                {profile.bio}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-soft"
                  style={{ backgroundColor: "var(--ui-field-bg, #ffffff)" }}
                >
                  <item.icon size={16} className="text-accent-deep" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href={bookingHref}
                documentNavigation={guidedDemo}
                className="gap-2"
              >
                Выбрать время
                <ArrowRight size={16} />
              </ButtonLink>
              {hasPortfolioWorks ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPortfolioOpen(true)}
                >
                  Готовые работы
                </Button>
              ) : (
                <ButtonLink href="#services" variant="secondary">
                  Посмотреть услуги
                </ButtonLink>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className="rounded-[28px] border border-line p-5"
                style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
              >
                <p className="text-sm text-muted">Цена от</p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {startingPrice !== null ? formatCurrency(startingPrice) : "По запросу"}
                </p>
              </div>
              <div
                className="rounded-[28px] border border-line p-5"
                style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
              >
                <p className="text-sm text-muted">Длительность от</p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {shortestDuration !== null ? `${shortestDuration} мин` : "Уточняется"}
                </p>
              </div>
              <div
                className="rounded-[28px] border border-line p-5"
                style={{ backgroundColor: "var(--color-accent-soft)" }}
              >
                <p className="text-sm text-muted">Свободные окна</p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {closestSlots.length > 0 ? "Есть онлайн" : "По запросу"}
                </p>
              </div>
            </div>
          </div>

          <div
            data-demo-id="slots"
            className="relative overflow-hidden rounded-[36px] border p-6 shadow-[0_32px_120px_rgba(35,36,31,0.08)] backdrop-blur sm:p-8"
            style={{
              backgroundColor: "var(--public-surface-strong)",
              borderColor: "var(--public-edge)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at top right, var(--public-glow-a), transparent 26%), radial-gradient(circle at bottom left, var(--public-glow-c), transparent 32%)",
              }}
            />
            <div className="relative">
              {showDemoSections ? (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink shadow-[0_12px_32px_rgba(35,36,31,0.08)] backdrop-blur"
                  style={{ backgroundColor: "var(--public-surface-strong)" }}
                >
                  <Sparkles size={16} className="text-accent-deep" />
                  Спокойный формат без лишних экранов
                </div>
              ) : null}

              <div className={showDemoSections ? "mt-6 flex items-start justify-between gap-4" : "flex items-start justify-between gap-4"}>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-muted">
                    Ближайшие окна
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-ink sm:text-[2rem]">
                    {showDemoSections ? "Можно выбрать онлайн" : "Свободные окна"}
                  </h2>
                </div>
                <CalendarClock size={24} className="mt-1 shrink-0 text-accent-deep" />
              </div>

              {closestSlots.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {closestSlots.map((slot) => (
                    guidedDemo ? (
                      <a
                        key={`${slot.serviceId}-${slot.date}-${slot.time}`}
                        href={bookingHref}
                        className="flex items-center justify-between gap-4 rounded-[28px] border border-line px-4 py-4 shadow-[0_10px_30px_rgba(35,36,31,0.04)] transition hover:-translate-y-0.5"
                        style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium text-ink">
                            {slot.serviceTitle}
                          </p>
                          <p className="mt-1 text-sm text-ink-soft">{slot.dateLabel}</p>
                        </div>
                        <div className="shrink-0 rounded-full bg-panel px-4 py-2 text-base font-medium text-ink">
                          {slot.time}
                        </div>
                      </a>
                    ) : (
                      <Link
                        key={`${slot.serviceId}-${slot.date}-${slot.time}`}
                        href={bookingHref}
                        className="flex items-center justify-between gap-4 rounded-[28px] border border-line px-4 py-4 shadow-[0_10px_30px_rgba(35,36,31,0.04)] transition hover:-translate-y-0.5"
                        style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium text-ink">
                            {slot.serviceTitle}
                          </p>
                          <p className="mt-1 text-sm text-ink-soft">{slot.dateLabel}</p>
                        </div>
                        <div className="shrink-0 rounded-full bg-panel px-4 py-2 text-base font-medium text-ink">
                          {slot.time}
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              ) : (
                <div
                  className="mt-6 rounded-[28px] border border-line p-5"
                  style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
                >
                  <p className="text-sm leading-7 text-ink-soft">
                    {showDemoSections
                      ? "Свободные слоты обновляются автоматически. Если сейчас всё занято, открой запись и проверь ближайшие даты."
                      : "Свободных слотов на ближайшие дни пока нет. Можно написать мастеру напрямую или проверить дату позже."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {guidedDemo ? <DemoStoryChapter step={demoStorySteps[2]} /> : null}

        {showDemoSections ? (
          hasPortfolioWorks ? (
            <section
              id="works"
              data-demo-id="works"
              className="relative mt-16 rounded-[40px] space-y-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl space-y-3">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
                    Готовые работы
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                    Можно заранее почувствовать стиль мастера
                  </h2>
                  <p className="text-base leading-7 text-ink-soft sm:text-lg">
                    Подборка показывает реальные работы из кабинета. Если хочется
                    посмотреть всё крупнее, открой pop-up и пролистай всю галерею.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPortfolioOpen(true)}
                  className="gap-2"
                >
                  Открыть всю галерею
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {profile.portfolioWorks.map((work, index) => (
                  <button
                    key={work.id}
                    type="button"
                    onClick={() => setIsPortfolioOpen(true)}
                    className="group overflow-hidden rounded-[32px] border border-line text-left shadow-[0_24px_80px_rgba(35,36,31,0.08)]"
                    style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={work.imageUrl}
                        alt={`${profile.fullName}, работа ${index + 1}`}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,21,18,0.72)] to-transparent px-4 py-4">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-medium text-ink"
                          style={{ backgroundColor: "var(--public-surface-strong)" }}
                        >
                          Работа {index + 1}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null
        ) : (
          <section
            id="works"
            data-demo-id="works"
            className="relative mt-14 rounded-[40px] space-y-6"
          >
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
                Портфолио
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Работы мастера
              </h2>
            </div>
            {hasPortfolioWorks ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <p className="text-sm text-muted">
                    Нажми на любую работу, чтобы открыть галерею.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsPortfolioOpen(true)}
                    className="gap-2"
                  >
                    Открыть галерею
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {profile.portfolioWorks.map((work, index) => (
                    <button
                      key={work.id}
                      type="button"
                      onClick={() => setIsPortfolioOpen(true)}
                      className="group overflow-hidden rounded-[32px] border border-line text-left shadow-[0_24px_80px_rgba(35,36,31,0.08)]"
                      style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <Image
                          src={work.imageUrl}
                          alt={`${profile.fullName}, работа ${index + 1}`}
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div
                className="rounded-[28px] border border-dashed border-line p-6 text-sm leading-7 text-muted"
                style={{ backgroundColor: "var(--ui-card-bg, #ffffff)" }}
              >
                Здесь появятся примеры работ. Мастер добавит их из кабинета, чтобы
                показать стиль и уровень.
              </div>
            )}
          </section>
        )}

        {guidedDemo ? <DemoStoryChapter step={demoStorySteps[3]} /> : null}

        <section
          id="services"
          data-demo-id="services"
          className="relative mt-16 rounded-[40px] space-y-6"
        >
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
              Услуги
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {showDemoSections ? "Понятный каталог без перегруза" : "Что делает мастер"}
            </h2>
            {showDemoSections ? (
              <p className="text-base leading-7 text-ink-soft sm:text-lg">
                Каждая услуга сразу показывает, сколько длится визит и во сколько он
                обойдётся, чтобы клиент принимал решение спокойно и без лишних уточнений.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service, index) => (
              <article
                key={service.id}
                className="group relative overflow-hidden rounded-[32px] border border-line p-6 shadow-[0_24px_80px_rgba(35,36,31,0.08)]"
                style={{
                  backgroundColor:
                    index % 2 === 0
                      ? "var(--ui-card-bg, #ffffff)"
                      : "var(--color-accent-soft)",
                }}
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm uppercase tracking-[0.18em] text-muted">
                        {service.durationMinutes} минут
                      </p>
                      <h3 className="text-2xl font-semibold text-ink">
                        {service.title}
                      </h3>
                    </div>
                    <div
                      className="rounded-full px-4 py-2 text-sm font-medium text-ink shadow-sm"
                      style={{ backgroundColor: "var(--public-surface-strong)" }}
                    >
                      {formatCurrency(service.price)}
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-ink-soft sm:text-base">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-sm text-muted">
                      {showDemoSections
                        ? "Запись без регистрации и звонка"
                        : `${service.durationMinutes} мин • ${formatCurrency(service.price)}`}
                    </span>
                    <ButtonLink
                      href={bookingHref}
                      documentNavigation={guidedDemo}
                      variant="secondary"
                      className="gap-2"
                    >
                      Выбрать
                      <ArrowRight size={16} />
                    </ButtonLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {guidedDemo ? <DemoStoryChapter step={demoStorySteps[4]} /> : null}

        {showDemoSections ? (
          <section
            data-demo-id="rules"
            className="relative mt-16 rounded-[40px] grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
          <div className="rounded-[36px] border border-transparent bg-[linear-gradient(145deg,#23241f_0%,#343730_100%)] p-6 text-white shadow-[0_30px_90px_rgba(35,36,31,0.18)] sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">
              Как всё устроено
            </p>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
              Запись выглядит как личная витрина мастера, а не как форма из банка
            </h2>
            <div className="mt-8 space-y-4">
              {infoItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-white/10 bg-white/6 p-5"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="text-[var(--color-accent)]" />
                    <h3 className="text-lg font-medium text-white">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/70">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-[36px] border border-line bg-white/82 p-6 shadow-[0_24px_80px_rgba(35,36,31,0.08)] backdrop-blur sm:p-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-muted">
                Что важно знать
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Всё, что помогает решиться на запись
              </h2>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-line bg-panel p-5">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-accent-deep" />
                  <h3 className="text-lg font-medium text-ink">Локация и описание</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  Мастер сам указывает район, описание и формат приёма в кабинете, а
                  публичная страница сразу показывает оформленную версию этих данных.
                </p>
              </div>

              <div className="rounded-[28px] border border-line bg-white p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-accent-deep" />
                  <h3 className="text-lg font-medium text-ink">Перенос и отмена</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  Мастер сам задаёт, до какого момента запись можно отменить или
                  перенести самостоятельно. Эти правила применяются к каждой записи
                  без ручных уточнений.
                </p>
              </div>

              <div className="rounded-[28px] border border-line bg-[rgba(238,247,240,0.92)] p-5">
                <div className="flex items-center gap-3">
                  <MessageCircleHeart size={18} className="text-accent-deep" />
                  <h3 className="text-lg font-medium text-ink">Подтверждение и напоминания</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  После бронирования клиент сразу видит подтверждение на экране, а
                  уведомления и напоминания для клиента и мастера включаются в
                  настройках записи.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-dashed border-line px-5 py-4 text-sm text-muted">
              Страница сделана так, чтобы её было не стыдно отправить клиенту в
              мессенджер: крупная витрина, понятные услуги и быстрый путь к записи.
            </div>
          </div>
        </section>
        ) : null}

        {guidedDemo ? (
          <DemoStoryOutro cleanHref={guidedDemoCleanHref} />
        ) : null}

        <footer className="mt-16 flex flex-col gap-4 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Онлайн-запись к {profile.fullName}. Спокойная витрина мастера без лишнего
            шума.
          </p>
          <Link href="/" className="font-medium text-ink underline underline-offset-4">
            Создано в okno
          </Link>
        </footer>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <ButtonLink
          href={bookingHref}
          documentNavigation={guidedDemo}
          className="w-full justify-center gap-2 rounded-[22px] py-4 text-base shadow-[0_18px_50px_rgba(35,36,31,0.22)]"
        >
          Записаться онлайн
          <ArrowRight size={18} />
        </ButtonLink>
      </div>

      <PortfolioModal
        fullName={profile.fullName}
        works={profile.portfolioWorks}
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
      />
    </main>
  );
}
