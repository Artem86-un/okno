import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { env, isSupabaseConfigured } from "@/lib/env";
import {
  encryptPhone,
  humanizeBookingDate,
  phoneLast4,
  toUtcIsoFromLocalSlot,
} from "@/lib/booking";
import { sendBookingConfirmationSms, sendMasterTelegramNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { services as mockServices } from "@/lib/mock-data";

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
    const params = new URLSearchParams({
      service: mockService?.title ?? "Запись",
      date: parsed.data.date,
      time: parsed.data.time,
      name: parsed.data.name,
      phone: parsed.data.phone,
    });

    return NextResponse.json({
      ok: true,
      redirectUrl: `/${parsed.data.username}/confirm?${params.toString()}`,
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
  const slotBusyStart = new Date(startsAt.getTime() - bufferMinutes * 60_000);

  const [{ data: collisionRows, error: collisionError }, { data: blockedRows, error: blockedError }] =
    await Promise.all([
      admin
        .from("bookings")
        .select("id, starts_at, ends_at")
        .eq("profile_id", profileRow.id)
        .eq("status", "confirmed")
        .lt("starts_at", slotBusyEnd.toISOString())
        .gt("ends_at", slotBusyStart.toISOString()),
      admin
        .from("blocked_slots")
        .select("id, starts_at, ends_at")
        .eq("profile_id", profileRow.id)
        .lt("starts_at", slotBusyEnd.toISOString())
        .gt("ends_at", startsAt.toISOString()),
    ]);

  if (collisionError || blockedError) {
    return NextResponse.json(
      { error: "Не получилось проверить свободное время." },
      { status: 500 },
    );
  }

  const candidateStart = DateTime.fromJSDate(startsAt, { zone: "utc" });
  const candidateBusyEnd = DateTime.fromJSDate(slotBusyEnd, { zone: "utc" });

  const hasBookingCollision = (collisionRows ?? []).some((booking) => {
    const bookingStart = DateTime.fromISO(String(booking.starts_at), {
      zone: "utc",
    });
    const bookingBusyEnd = DateTime.fromISO(String(booking.ends_at), {
      zone: "utc",
    }).plus({ minutes: bufferMinutes });

    return candidateStart < bookingBusyEnd && candidateBusyEnd > bookingStart;
  });

  const hasBlockedCollision = (blockedRows ?? []).some((blockedSlot) => {
    const blockedStart = DateTime.fromISO(String(blockedSlot.starts_at), {
      zone: "utc",
    });
    const blockedEnd = DateTime.fromISO(String(blockedSlot.ends_at), {
      zone: "utc",
    });

    return candidateStart < blockedEnd && candidateBusyEnd > blockedStart;
  });

  if (hasBookingCollision || hasBlockedCollision) {
    return NextResponse.json(
      { error: "Это время уже занято. Выбери другой слот." },
      { status: 409 },
    );
  }

  const encryptedPhone = encryptPhone(storedPhone);
  let clientRow: { id: string } | null = null;

  const { data: existingClient, error: existingClientError } = await admin
    .from("clients")
    .select("id")
    .eq("profile_id", profileRow.id)
    .eq("phone_encrypted", encryptedPhone)
    .maybeSingle();

  if (existingClientError) {
    return NextResponse.json(
      { error: "Не получилось найти клиента в базе." },
      { status: 500 },
    );
  }

  if (existingClient) {
    const { data: updatedClient, error: updateClientError } = await admin
      .from("clients")
      .update({
        name: parsed.data.name,
        last_booking_at: startsAt.toISOString(),
      })
      .eq("id", existingClient.id)
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

  const params = new URLSearchParams({
    service: String(serviceRow.title),
    date: parsed.data.date,
    time: parsed.data.time,
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  return NextResponse.json({
    ok: true,
    redirectUrl: `${env.appUrl}/${parsed.data.username}/confirm?${params.toString()}`,
  });
}
