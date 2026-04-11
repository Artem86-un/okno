"use client";

import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BookingSlot, Service } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/mock-data";

type BookingFlowProps = {
  username: string;
  services: Service[];
  bookingSlotsByService: Record<string, BookingSlot[]>;
};

const steps = ["Услуга", "Дата и время", "Контакты"];

export function BookingFlow({
  username,
  services,
  bookingSlotsByService,
}: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const initialSlots = bookingSlotsByService[services[0]?.id ?? ""] ?? [];
  const [dateValue, setDateValue] = useState(initialSlots[0]?.value ?? "");
  const [time, setTime] = useState(initialSlots[0]?.times[0] ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId, services],
  );
  const bookingSlots = useMemo(
    () => bookingSlotsByService[serviceId] ?? [],
    [bookingSlotsByService, serviceId],
  );
  const selectedDate = bookingSlots.find((slot) => slot.value === dateValue);
  const selectedDateLabel = dateValue
    ? DateTime.fromISO(dateValue).setLocale("ru").toFormat("d LLLL")
    : "";

  useEffect(() => {
    const firstDay = bookingSlots[0];

    if (!firstDay) {
      setDateValue("");
      setTime("");
      return;
    }

    if (!bookingSlots.some((slot) => slot.value === dateValue)) {
      setDateValue(firstDay.value);
      setTime(firstDay.times[0] ?? "");
      return;
    }

    if (!selectedDate?.times.includes(time)) {
      setTime(selectedDate?.times[0] ?? firstDay.times[0] ?? "");
    }
  }, [bookingSlots, dateValue, time, selectedDate]);

  const nextStep = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const prevStep = () => setStep((current) => Math.max(current - 1, 0));

  const submit = async () => {
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          serviceId,
          date: dateValue,
          time,
          name,
          phone,
          note,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Не получилось создать запись.");
        return;
      }

      const redirectUrl = String(payload.redirectUrl || `/${username}/confirm`);
      if (redirectUrl.startsWith("http")) {
        const url = new URL(redirectUrl);
        router.push(`${url.pathname}${url.search}`);
      } else {
        router.push(redirectUrl);
      }
    } catch {
      setError("Что-то пошло не так. Попробуй еще раз.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          {steps.map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs",
                  index <= step
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-muted",
                )}
              >
                {index < step ? <Check size={14} /> : index + 1}
              </span>
              <span className="hidden sm:inline">{item}</span>
            </div>
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-panel">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 ? (
        <div className="grid gap-3">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setServiceId(service.id)}
              className={cn(
                "touch-manipulation rounded-[24px] border p-4 text-left transition active:scale-[0.99]",
                service.id === serviceId
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-white hover:bg-panel",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium text-ink">{service.title}</p>
                  <p className="text-sm leading-6 text-muted">
                    {service.description}
                  </p>
                </div>
                <div className="text-right text-sm text-ink-soft">
                  <p>{service.durationMinutes} мин</p>
                  <p>{formatCurrency(service.price)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-ink">
              Выберите дату
            </h2>
            {bookingSlots.length > 0 ? (
              <>
                <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x snap-mandatory sm:hidden">
                  {bookingSlots.map((slot) => {
                    const slotDate = DateTime.fromISO(slot.value, {
                      zone: "utc",
                    }).setLocale("ru");
                    const weekdayLabel = slotDate.toFormat("ccc");
                    const dayNumber = slotDate.toFormat("d");

                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setDateValue(slot.value)}
                        className="touch-manipulation snap-start shrink-0 active:scale-[0.99]"
                      >
                        <div
                          className={cn(
                            "flex min-w-[78px] flex-col items-center rounded-[18px] border px-4 py-3 text-center transition",
                            slot.value === dateValue
                              ? "border-ink bg-ink text-white"
                              : "border-line bg-white text-ink",
                          )}
                        >
                          <p
                            className={cn(
                              "text-[11px] font-medium uppercase tracking-[0.08em]",
                              slot.value === dateValue
                                ? "text-white/70"
                                : "text-ink-soft",
                            )}
                          >
                            {weekdayLabel}
                          </p>
                          <div
                            className="mt-1 text-[30px] leading-none font-semibold"
                          >
                            {dayNumber}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden gap-3 sm:grid sm:grid-cols-4 lg:grid-cols-7">
                  {bookingSlots.map((slot) => {
                    const slotDate = DateTime.fromISO(slot.value, {
                      zone: "utc",
                    }).setLocale("ru");
                    const weekdayLabel = slotDate.toFormat("ccc");
                    const dayNumber = slotDate.toFormat("d");

                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setDateValue(slot.value)}
                        className="touch-manipulation space-y-3 text-center active:scale-[0.99]"
                      >
                        <p className="text-sm font-medium uppercase text-ink-soft">
                          {weekdayLabel}
                        </p>
                        <div
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-xl font-medium transition",
                            slot.value === dateValue
                              ? "border-ink bg-ink text-white"
                              : "border-line bg-white text-ink hover:bg-panel",
                          )}
                        >
                          {dayNumber}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-[24px] border border-dashed border-line p-5 text-sm leading-6 text-muted">
                На ближайшие дни свободного времени пока нет. Попробуй выбрать другую услугу или зайди позже.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-ink">
              Свободное время
            </h2>
            {selectedDate && selectedDate.times.length > 0 ? (
              <>
                <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x snap-mandatory sm:hidden">
                  {selectedDate.times.map((slotTime) => (
                    <button
                      key={slotTime}
                      type="button"
                      onClick={() => setTime(slotTime)}
                      className={cn(
                        "touch-manipulation snap-start shrink-0 rounded-[18px] border px-5 py-3 text-center text-lg font-semibold transition active:scale-[0.99]",
                        slotTime === time
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-ink",
                      )}
                    >
                      {slotTime}
                    </button>
                  ))}
                </div>

                <div className="hidden grid-cols-2 gap-x-6 gap-y-4 sm:grid sm:grid-cols-3">
                  {selectedDate.times.map((slotTime) => (
                    <button
                      key={slotTime}
                      type="button"
                      onClick={() => setTime(slotTime)}
                      className={cn(
                        "touch-manipulation rounded-[22px] px-4 py-4 text-center text-2xl font-medium transition active:scale-[0.99]",
                        slotTime === time
                          ? "bg-ink text-white"
                          : "bg-transparent text-ink hover:bg-panel",
                      )}
                    >
                      {slotTime}
                    </button>
                  ))}
                </div>
              </>
            ) : selectedDate ? (
              <div className="rounded-[24px] border border-dashed border-line p-5 text-sm leading-6 text-muted">
                На эту дату свободного времени уже нет.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4">
          <Input
            label="Как вас зовут"
            placeholder="Например, Марина"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Телефон"
            placeholder="+7 978 000-00-00"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            hint="Нужен только для подтверждения записи и связи по визиту. Никакого спама."
          />
          <Textarea
            label="Комментарий к записи"
            placeholder="Например: аллергия на гель, опоздаю на 10 минут, хочу нюд без дизайна"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            hint="Поле необязательное, но мастеру правда полезно."
          />
        </div>
      ) : null}

      {step === steps.length - 1 ? (
        <div className="rounded-[24px] bg-panel p-4 text-sm text-ink-soft">
          <p className="font-medium text-ink">Что вы выбрали</p>
          <p className="mt-2">
            {selectedService?.title} • {selectedDateLabel} • {time}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[20px] bg-warning-soft px-4 py-3 text-sm text-warning">
          {error}
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          step === steps.length - 1 ? "justify-center" : "justify-between",
        )}
      >
        <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
          Назад
        </Button>
        {step < steps.length - 1 ? (
          <Button
            onClick={nextStep}
            className="gap-2"
            disabled={
              (step === 0 && !selectedService) ||
              (step === 1 && (!dateValue || !time))
            }
          >
            Дальше
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={!name || !phone || pending}
            className="min-w-56 gap-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Создаю запись..." : "Подтвердить запись"}
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
}
