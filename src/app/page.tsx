import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { SectionTitle } from "@/components/sections/section-title";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pricingPlans, profile, services } from "@/lib/mock-data";

const valueProps = [
  "Мастер запускается за 3 шага и получает ссылку сразу",
  "Клиент записывается без регистрации, капчи и лишних экранов",
  "Телефон объясняем честно: только для подтверждения и связи",
];

const comparisons = [
  {
    title: "Перегруженные сервисы",
    points: [
      "Сложный первый запуск и пугающий кабинет",
      "Бизнес-термины вместо понятного языка",
      "Запись выглядит как форма из банка",
    ],
  },
  {
    title: "okno",
    points: [
      "Теплый интерфейс, который приятно показать клиенту",
      "Минимум настроек и только нужные действия",
      "Продукт думает о доверии, а не о навязчивом апсейле",
    ],
  },
];

export default function HomePage() {
  return (
    <SiteShell hideGuestMenu>
      <div className="space-y-20 pb-10">
        <section className="grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <Badge tone="accent">Для мастеров маникюра и бровей</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-6xl">
                Онлайн-запись, которая выглядит спокойно, красиво и по-человечески.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)]">
                `okno` помогает маленьким мастерам перестать записывать вручную, не
                проваливаясь в тяжелые CRM. Мастер получает порядок. Клиент получает
                приятный путь к записи.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/register" className="gap-2">
                Начать бесплатно
                <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href={`/${profile.username}`} variant="secondary">
                Посмотреть публичную страницу
              </ButtonLink>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {valueProps.map((item) => (
                <Card key={item} className="rounded-[24px] p-4">
                  <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{item}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="m-4 rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
              <p className="text-sm text-[var(--color-muted)]">Превью публичной страницы</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                {profile.fullName}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{profile.bio}</p>
            </div>
            <div className="space-y-4 px-4 pb-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-[24px] border border-[var(--color-line)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-[var(--color-ink)]">{service.title}</p>
                      <p className="text-sm leading-6 text-[var(--color-muted)]">
                        {service.description}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[var(--color-ink-soft)]">
                      <p>{service.durationMinutes} мин</p>
                      <p>{service.price} ₽</p>
                    </div>
                  </div>
                </div>
              ))}
              <ButtonLink href={`/${profile.username}/book`} className="w-full justify-center">
                Записаться онлайн
              </ButtonLink>
            </div>
          </Card>
        </section>

        <section className="space-y-8">
          <SectionTitle
            eyebrow="Почему зайдет"
            title="Не очередной сервис с перегрузом, а аккуратный инструмент для реальной жизни."
            description="Здесь все строится не вокруг воронок и KPI, а вокруг того, чтобы мастер не терял клиентов, а клиенту было приятно записываться."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {comparisons.map((comparison) => (
              <Card key={comparison.title}>
                <h3 className="text-xl font-semibold text-[var(--color-ink)]">
                  {comparison.title}
                </h3>
                <div className="mt-5 space-y-3">
                  {comparison.points.map((point) => (
                    <div key={point} className="flex gap-3">
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0 text-[var(--color-accent-deep)]"
                      />
                      <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{point}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionTitle
            eyebrow="Как работает"
            title="Три простых шага, после которых у мастера уже есть рабочая ссылка."
            description="Вместо долгой настройки мы ведем за руку: создаем профиль, первую услугу и готовую страницу для клиента."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: CalendarDays,
                title: "1. Создать профиль",
                text: "Имя, ниша, username и спокойный парольный вход без магических писем, в которых легко потеряться.",
              },
              {
                icon: Sparkles,
                title: "2. Добавить первую услугу",
                text: "Цена, длительность и короткое описание вроде “включает покрытие, без дизайна”.",
              },
              {
                icon: MessageSquareText,
                title: "3. Отправить ссылку клиенту",
                text: "Клиент выбирает дату и время, оставляет телефон и получает SMS-подтверждение.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <item.icon size={28} className="text-[var(--color-accent-deep)]" />
                <h3 className="mt-6 text-xl font-semibold text-[var(--color-ink)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <LockKeyhole size={20} className="text-[var(--color-accent-deep)]" />
              <h3 className="text-xl font-semibold text-[var(--color-ink)]">
                Про доверие и приватность
              </h3>
            </div>
            <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
              `okno` не строится на сборе номеров “на будущее”. Телефон клиента
              используется только для подтверждения записи и связи по визиту. Никаких
              холодных рассылок, сложных капч и агрессивных тарифов.
            </p>
            <Link
              href="/settings"
              className="inline-flex text-sm font-medium text-[var(--color-ink)] underline underline-offset-4"
            >
              Посмотреть, как это объясняется внутри продукта
            </Link>
          </Card>

          <Card
            className="space-y-4 border-transparent text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--color-ink) 0%, #35362f 100%)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">Сейчас у мастера</p>
            <div className="space-y-2">
              <h3 className="text-3xl font-semibold text-white">47 из 50 записей в этом месяце</h3>
              <p className="max-w-lg text-sm leading-7 text-white/70">
                На бесплатном тарифе мастер видит остаток лимита заранее, чтобы переход
                на Pro не был неожиданным и навязчивым.
              </p>
            </div>
            <ButtonLink href="/pricing" variant="secondary" className="w-fit bg-white text-[var(--color-ink)]">
              Посмотреть тарифы
            </ButtonLink>
          </Card>
        </section>

        <section className="space-y-8">
          <SectionTitle
            eyebrow="Тарифы"
            title="Бесплатный тариф действительно работает, а платный не стыдно предложить."
            description="В первой версии без checkout, но уже с честной логикой лимитов и понятным апгрейдом."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.title}
                className={plan.title === "okno Pro" ? "bg-[var(--color-panel)]" : ""}
              >
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-ink-soft)]">
                  {plan.title}
                </p>
                <h3 className="mt-3 text-4xl font-semibold text-[var(--color-ink)]">
                  {plan.price}
                </h3>
                <p className="mt-3 text-base leading-7 text-[var(--color-ink-soft)]">
                  {plan.description}
                </p>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex gap-3">
                      <CheckCircle2 size={18} className="mt-1 shrink-0 text-[var(--color-accent-deep)]" />
                      <p className="text-base leading-7 text-[var(--color-ink-soft)]">{feature}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
