import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import {
  decryptPhone,
  encryptPhone,
  hashPhone,
  humanizeBookingDate,
  phoneLast4,
  toUtcIsoFromLocalSlot,
} from "@/lib/booking";
import { saveMockBookingConfirmation } from "@/lib/mock-booking-confirmations";
import { sendBookingConfirmationSms, sendMasterTelegramNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { profile as mockProfile, services as mockServices } from "@/lib/mock-data";

const bookingSchema = z.object({
  username: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().min(6),
  note: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Проверь поля записи." }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    const mockService = mockServices.find((service) => service.id === parsed.data.serviceId);
    const startsAtIso = toUtcIsoFromLocalSlot({
      date: parsed.data.date,
      time: parsed.data.time,
      timezone: mockProfile.timezone,
    });
    const confirmation = saveMockBookingConfirmation({
      username: parsed.data.username,
      clientName: parsed.data.name,
      serviceTitle: mockService?.title ?? "Запись",
      startsAtIso: startsAtIso ?? new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      bookingId: confirmation.id,
      redirectUrl: `/${parsed.data.username}/confirm?bookingId=${confirmation.id}`,
    });
  }

  const admin = createSupabaseAdminClient();
  const normalizedPhone = parsed.data.phone.replace(/\D/g, "");
  const storedPhone = normalizedPhone || parsed.data.phone;
  const { data: profileRow, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "Не получилось связаться с базой мастера." },
      { status: 500 },
    );
  }

  if (!profileRow) {
    return NextResponse.json({ error: "Мастер не найден." }, { status: 404 });
  }

  const { data: serviceRow, error: serviceError } = await admin
    .from("services")
    .select("*")
    .eq("id", parsed.data.serviceId)
    .eq("profile_id", profileRow.id)
    .maybeSingle();

  if (serviceError) {
    return NextResponse.json(
      { error: "Не получилось загрузить выбранную услугу." },
      { status: 500 },
    );
  }

  if (!serviceRow) {
    return NextResponse.json({ error: "Услуга не найдена." }, { status: 404 });
  }

  const startsAtIso = toUtcIsoFromLocalSlot({
    date: parsed.data.date,
    time: parsed.data.time,
    timezone: String(profileRow.timezone ?? "Europe/Simferopol"),
  });

  if (!startsAtIso) {
    return NextResponse.json({ error: "Дата записи не распознана." }, { status: 400 });
  }

  const startsAt = new Date(startsAtIso);
  const endsAt = new Date(
    startsAt.getTime() + Number(serviceRow.duration_minutes) * 60_000,
  );
  const bufferMinutes = Number(profileRow.buffer_minutes ?? 0);
  const slotBusyEnd = new Date(endsAt.getTime() + bufferMinutes * 60_000);

  const { data: hasConflict, error: collisionError } = await admin.rpc(
    "has_booking_conflict",
    {
      p_profile_id: profileRow.id,
      p_candidate_start: startsAt.toISOString(),
      p_candidate_busy_end: slotBusyEnd.toISOString(),
      p_buffer_minutes: bufferMinutes,
    },
  );

  if (collisionError) {
    return NextResponse.json(
      { error: "Не получилось проверить свободное время." },
      { status: 500 },
    );
  }

  if (hasConflict) {
    return NextResponse.json(
      { error: "Это время уже занято. Выбери другой слот." },
      { status: 409 },
    );
  }

  const encryptedPhone = encryptPhone(storedPhone);
  const phoneHash = hashPhone(storedPhone);
  let clientRow: { id: string } | null = null;

  const { data: existingClient, error: existingClientError } = await admin
    .from("clients")
    .select("id")
    .eq("profile_id", profileRow.id)
    .eq("phone_hash", phoneHash)
    .maybeSingle();

  if (existingClientError) {
    return NextResponse.json(
      { error: "Не получилось найти клиента в базе." },
      { status: 500 },
    );
  }

  let resolvedClient = existingClient;

  if (!resolvedClient) {
    const { data: legacyClients, error: legacyClientError } = await admin
      .from("clients")
      .select("id, phone_encrypted, phone_hash")
      .eq("profile_id", profileRow.id)
      .is("phone_hash", null);

    if (legacyClientError) {
      return NextResponse.json(
        { error: "Не получилось найти клиента в базе." },
        { status: 500 },
      );
    }

    const matchedLegacyClient = (legacyClients ?? []).find((client) => {
      const encryptedPhoneValue =
        typeof client.phone_encrypted === "string" ? client.phone_encrypted : "";

      return decryptPhone(encryptedPhoneValue) === storedPhone;
    });

    if (matchedLegacyClient) {
      resolvedClient = { id: String(matchedLegacyClient.id) };
    }
  }

  if (resolvedClient) {
    const { data: updatedClient, error: updateClientError } = await admin
      .from("clients")
      .update({
        name: parsed.data.name,
        phone_encrypted: encryptedPhone,
        phone_hash: phoneHash,
        last_booking_at: startsAt.toISOString(),
      })
      .eq("id", resolvedClient.id)
      .select("id")
      .single();

    if (updateClientError || !updatedClient) {
      return NextResponse.json(
        { error: "Не получилось обновить данные клиента." },
        { status: 500 },
      );
    }

    clientRow = updatedClient;
  } else {
    const { data: insertedClient, error: insertClientError } = await admin
      .from("clients")
      .insert({
        profile_id: profileRow.id,
        name: parsed.data.name,
        phone_encrypted: encryptedPhone,
        phone_hash: phoneHash,
        phone_last4: phoneLast4(storedPhone),
        notes: "",
        last_booking_at: startsAt.toISOString(),
      })
      .select("id")
      .single();

    if (insertClientError || !insertedClient) {
      return NextResponse.json(
        { error: "Не получилось сохранить клиента." },
        { status: 500 },
      );
    }

    clientRow = insertedClient;
  }

  const { data: bookingRow, error: bookingError } = await admin
    .from("bookings")
    .insert({
      profile_id: profileRow.id,
      client_id: clientRow.id,
      service_id: serviceRow.id,
      status: "confirmed",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      source: "public_page",
      client_note: parsed.data.note,
      cancellation_token_expires_at: startsAt.toISOString(),
    })
    .select("*")
    .single();

  if (bookingError || !bookingRow) {
    return NextResponse.json({ error: "Не получилось создать запись." }, { status: 500 });
  }

  const startsAtLabel = humanizeBookingDate({
    startsAtIso: startsAt.toISOString(),
    timezone: String(profileRow.timezone ?? "Europe/Simferopol"),
  });

  const [smsResult, telegramResult] = await Promise.all([
    sendBookingConfirmationSms({
      phone: parsed.data.phone,
      masterName: String(profileRow.full_name),
      serviceTitle: String(serviceRow.title),
      startsAtLabel,
    }),
    sendMasterTelegramNotification({
      chatId: profileRow.telegram_chat_id ? String(profileRow.telegram_chat_id) : null,
      clientName: parsed.data.name,
      serviceTitle: String(serviceRow.title),
      startsAtLabel,
    }),
  ]);

  await admin.from("notification_events").insert([
    {
      profile_id: profileRow.id,
      type: "sms_confirmation",
      status: smsResult.ok ? "sent" : "queued",
      target: storedPhone,
    },
    {
      profile_id: profileRow.id,
      type: "telegram_new_booking",
      status: telegramResult.ok ? "sent" : "queued",
      target: profileRow.telegram_chat_id ?? "not_configured",
    },
  ]);

  return NextResponse.json({
    ok: true,
    bookingId: bookingRow.id,
    redirectUrl: `/${parsed.data.username}/confirm?bookingId=${bookingRow.id}`,
  });
}
