"use client";

import { useActionState } from "react";
import {
  registerMasterAction,
} from "@/app/actions/auth";
import { initialAuthActionState } from "@/components/forms/auth-state";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage, SubmitButton } from "@/components/forms/auth-form-state";

export function RegisterForm() {
  const [state, formAction] = useActionState(
    registerMasterAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <Card className="space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Шаг 1
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Личные данные и вход
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Имя мастера" name="fullName" placeholder="Алина" required />
          <Input label="Ниша" name="specialty" placeholder="Маникюр и брови" required />
          <Input label="Email" name="email" type="email" placeholder="you@example.com" required />
          <Input label="Пароль" name="password" type="password" placeholder="Минимум 8 символов" required />
        </div>
        <Input
          label="Публичная ссылка"
          name="username"
          placeholder="alina-nails"
          hint="Эту ссылку ты будешь отправлять клиентам. Например: okno.app/alina-nails"
          required
        />
      </Card>

      <Card className="space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Шаг 2
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Первая услуга
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Название услуги" name="serviceTitle" placeholder="Маникюр с покрытием" required />
          <Input label="Цена" name="servicePrice" type="number" placeholder="1900" required />
          <Input label="Длительность, мин" name="serviceDurationMinutes" type="number" placeholder="120" required />
          <Input label="Часовой пояс" name="timezone" defaultValue="Europe/Simferopol" required />
        </div>
        <Textarea
          label="Краткое описание"
          name="serviceDescription"
          placeholder="Включает покрытие, без дизайна"
          hint="Это описание будет видно клиенту на публичной странице."
        />
      </Card>

      <FormMessage message={state.message} success={state.success} />
      <SubmitButton
        idleLabel="Создать аккаунт и перейти в кабинет"
        pendingLabel="Создаю аккаунт..."
      />
    </form>
  );
}
