"use client";

import { useActionState } from "react";
import {
  loginMasterAction,
} from "@/app/actions/auth";
import { initialAuthActionState } from "@/components/forms/auth-state";
import { Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/forms/auth-form-state";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(
    loginMasterAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <Input label="Email" name="email" type="email" placeholder="you@example.com" required />
      <Input label="Пароль" name="password" type="password" placeholder="Введите пароль" required />
      <FormMessage message={state.message} success={state.success} />
      <SubmitButton idleLabel="Войти" pendingLabel="Вхожу..." className="w-full" />
    </form>
  );
}
