import { env, isSmsConfigured, isTelegramConfigured } from "@/lib/env";

export async function sendBookingConfirmationSms(input: {
  phone: string;
  masterName: string;
  serviceTitle: string;
  startsAtLabel: string;
}) {
  if (!isSmsConfigured) {
    return { ok: false as const, skipped: true as const };
  }

  try {
    const response = await fetch(env.smsApiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.smsApiKey}`,
      },
      body: JSON.stringify({
        phone: input.phone,
        message: `okno: запись к ${input.masterName} подтверждена. ${input.serviceTitle}, ${input.startsAtLabel}.`,
      }),
    });

    return { ok: response.ok, skipped: false as const };
  } catch {
    return { ok: false as const, skipped: false as const };
  }
}

export async function sendMasterTelegramNotification(input: {
  chatId: string | null;
  clientName: string;
  serviceTitle: string;
  startsAtLabel: string;
}) {
  if (!isTelegramConfigured || !input.chatId) {
    return { ok: false as const, skipped: true as const };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: input.chatId,
          text: `Новая запись: ${input.clientName}, ${input.serviceTitle}, ${input.startsAtLabel}.`,
        }),
      },
    );

    return { ok: response.ok, skipped: false as const };
  } catch {
    return { ok: false as const, skipped: false as const };
  }
}

export async function sendClientReminderSms(input: {
  phone: string;
  masterName: string;
  serviceTitle: string;
  startsAtLabel: string;
}) {
  if (!isSmsConfigured) {
    return { ok: false as const, skipped: true as const };
  }

  try {
    const response = await fetch(env.smsApiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.smsApiKey}`,
      },
      body: JSON.stringify({
        phone: input.phone,
        message: `okno: напоминание о записи к ${input.masterName}. ${input.serviceTitle}, ${input.startsAtLabel}.`,
      }),
    });

    return { ok: response.ok, skipped: false as const };
  } catch {
    return { ok: false as const, skipped: false as const };
  }
}

export async function sendMasterReminderTelegram(input: {
  chatId: string | null;
  clientName: string;
  serviceTitle: string;
  startsAtLabel: string;
}) {
  if (!isTelegramConfigured || !input.chatId) {
    return { ok: false as const, skipped: true as const };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: input.chatId,
          text: `Напоминание: скоро визит. ${input.clientName}, ${input.serviceTitle}, ${input.startsAtLabel}.`,
        }),
      },
    );

    return { ok: response.ok, skipped: false as const };
  } catch {
    return { ok: false as const, skipped: false as const };
  }
}
