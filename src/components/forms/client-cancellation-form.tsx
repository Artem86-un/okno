"use client";

import { useActionState } from "react";
import {
  cancelBookingByTokenAction,
  initialPublicBookingActionState,
} from "@/app/actions/public-bookings";
import { FormMessage, SubmitButton } from "@/components/forms/auth-form-state";

export function ClientCancellationForm({
  cancellationToken,
  disabled = false,
}: {
  cancellationToken: string;
  disabled?: boolean;
}) {
  const [state, action] = useActionState(
    cancelBookingByTokenAction,
    initialPublicBookingActionState,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="cancellationToken" value={cancellationToken} />
      <SubmitButton
        idleLabel={disabled ? "Отмена недоступна" : "Отменить запись"}
        pendingLabel="Отменяю..."
        className="w-full"
        disabled={disabled}
      />
      <FormMessage message={state.message} success={state.success} />
    </form>
  );
}
