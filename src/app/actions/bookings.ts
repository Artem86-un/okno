"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";
import { z } from "zod";
import {
  decryptPhone,
  encryptPhone,
  getCancellationDeadlineIso,
  hashPhone,
  phoneLast4,
} from "@/lib/booking";
import { getCurrentAuthProfile } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import {
  blockedSlots as mockBlockedSlots,
  bookings as mockBookings,
  clients as mockClients,
  services as mockServices,
} from "@/lib/mock-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type BookingOperationActionState = {
  success: boolean;
  message: string;
};

const manualBookingSchema = z.object({
  serviceId: z.string().min(1),
  name: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  date: z.string().min(1),
  time: z.string().min(1),
  note: z.string().trim().default(""),
});

const bookingIdSchema = z.object({
  bookingId: z.string().min(1),
});

const clientNotesSchema = z.object({
  clientId: z.string().min(1),
  notes: z.string().trim().default(""),
});

async function requireProfile() {
  const authProfile = await getCurrentAuthProfile();

  return authProfile?.profile ?? null;
}

function revalidateBookingPaths(username: string) {
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  revalidatePath("/clients");
  revalidatePath(`/${username}`);
  revalidatePath(`/${username}/book`);
}

function formatMockPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const last4 = phoneLast4(digits);

  return last4 ? `***${last4}` : phone;
}

function hasMockConflict(input: {
  profileId: string;
  startsAtIso: string;
  endsAtIso: string;
  bufferMinutes: number;
}) {
  const candidateStart = DateTime.fromISO(input.startsAtIso, { zone: "utc" });
  const candidateBusyEnd = DateTime.fromISO(input.endsAtIso, { zone: "utc" }).plus({
    minutes: input.bufferMinutes,
  });

  const bookingConflict = mockBookings.some((booking) => {
    if (booking.profileId !== input.profileId || booking.status !== "confirmed") {
      return false;
    }

    const bookingStart = DateTime.fromISO(booking.startsAt, { zone: "utc" });
    const bookingBusyEnd = DateTime.fromISO(booking.endsAt, { zone: "utc" }).plus({
      minutes: input.bufferMinutes,
    });

    return candidateStart < bookingBusyEnd && candidateBusyEnd > bookingStart;
  });

  const blockedConflict = mockBlockedSlots.some((blockedSlot) => {
    if (blockedSlot.profileId !== input.profileId) {
      return false;
    }

    const blockedStart = DateTime.fromISO(blockedSlot.startsAt, { zone: "utc" });
    const blockedEnd = DateTime.fromISO(blockedSlot.endsAt, { zone: "utc" });

    return candidateStart < blockedEnd && candidateBusyEnd > blockedStart;
  });

  return bookingConflict || blockedConflict;
}

export async function createManualBookingAction(
  _prevState: BookingOperationActionState,
  formData: FormData,
) {
  const profile = await requireProfile();

  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = manualBookingSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      success: false,
      message: "Проверь имя клиента, телефон, услугу и время записи.",
    };
  }

  const startsAt = DateTime.fromISO(
    `${parsed.data.date}T${parsed.data.time}`,
    { zone: profile.timezone },
  );

  if (!startsAt.isValid) {
    return {
      success: false,
      message: "Не получилось распознать дату и время записи.",
    };
  }

  if (startsAt <= DateTime.now().setZone(profile.timezone)) {
    return {
      success: false,
      message: "Ручную запись стоит ставить на будущее время.",
    };
  }

  if (!isSupabaseConfigured) {
    const service = mockServices.find((item) => item.id === parsed.data.serviceId);

    if (!service) {
      return { success: false, message: "Услуга не найдена." };
    }

    const startsAtIso = startsAt.toUTC().toISO();
    const endsAtIso = startsAt
      .plus({ minutes: service.durationMinutes })
      .toUTC()
      .toISO();

    if (!startsAtIso || !endsAtIso) {
      return { success: false, message: "Не получилось сохранить время записи." };
    }

    if (
      hasMockConflict({
        profileId: profile.id,
        startsAtIso,
        endsAtIso,
        bufferMinutes: profile.bufferMinutes,
      })
    ) {
      return { success: false, message: "Это время уже занято." };
    }

    const normalizedPhone = parsed.data.phone.replace(/\D/g, "");
    const existingClient = mockClients.find(
      (client) =>
        client.profileId === profile.id &&
        client.phoneMasked.endsWith(phoneLast4(normalizedPhone)),
    );
    const clientId = existingClient?.id ?? randomUUID();

    if (existingClient) {
      existingClient.name = parsed.data.name;
      existingClient.lastBookingAt = startsAtIso;
    } else {
      mockClients.unshift({
        id: clientId,
        profileId: profile.id,
        name: parsed.data.name,
        phoneMasked: formatMockPhone(parsed.data.phone),
        notes: "",
        createdAt: new Date().toISOString(),
        lastBookingAt: startsAtIso,
      });
    }

    mockBookings.unshift({
      id: randomUUID(),
      profileId: profile.id,
      clientId,
      serviceId: service.id,
      status: "confirmed",
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      source: "manual",
      clientNote: parsed.data.note,
      cancellationToken: randomUUID().replace(/-/g, ""),
      cancellationTokenExpiresAt:
        getCancellationDeadlineIso({
          startsAtIso,
          cancellationNoticeHours: profile.cancellationNoticeHours,
        }) ?? startsAtIso,
      createdAt: new Date().toISOString(),
      cancelledAt: null,
    });

    revalidateBookingPaths(profile.username);

    return { success: true, message: "Запись добавлена в календарь." };
  }

  const admin = createSupabaseAdminClient();
  const { data: serviceRow, error: serviceError } = await admin
    .from("services")
    .select("*")
    .eq("id", parsed.data.serviceId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (serviceError) {
    return { success: false, message: "Не получилось загрузить услугу." };
  }

  if (!serviceRow) {
    return { success: false, message: "Услуга не найдена." };
  }

  const startsAtIso = startsAt.toUTC().toISO();
  const endsAtIso = startsAt
    .plus({ minutes: Number(serviceRow.duration_minutes) })
    .toUTC()
    .toISO();

  if (!startsAtIso || !endsAtIso) {
    return { success: false, message: "Не получилось сохранить время записи." };
  }

  const slotBusyEndIso = DateTime.fromISO(endsAtIso, { zone: "utc" })
    .plus({ minutes: profile.bufferMinutes })
    .toISO() ?? endsAtIso;

  const { data: hasConflict, error: conflictError } = await admin.rpc(
    "has_booking_conflict",
    {
      p_profile_id: profile.id,
      p_candidate_start: startsAtIso,
      p_candidate_busy_end: slotBusyEndIso,
      p_buffer_minutes: profile.bufferMinutes,
    },
  );

  if (conflictError) {
    return {
      success: false,
      message: "Не получилось проверить свободное время.",
    };
  }

  if (hasConflict) {
    return { success: false, message: "Это время уже занято." };
  }

  const normalizedPhone = parsed.data.phone.replace(/\D/g, "");
  const storedPhone = normalizedPhone || parsed.data.phone;
  const encryptedPhone = encryptPhone(storedPhone);
  const phoneHash = hashPhone(storedPhone);

  let resolvedClientId: string | null = null;

  const { data: existingClient, error: existingClientError } = await admin
    .from("clients")
    .select("id")
    .eq("profile_id", profile.id)
    .eq("phone_hash", phoneHash)
    .maybeSingle();

  if (existingClientError) {
    return { success: false, message: "Не получилось найти клиента." };
  }

  if (existingClient) {
    resolvedClientId = String(existingClient.id);
  } else {
    const { data: legacyClients, error: legacyClientsError } = await admin
      .from("clients")
      .select("id, phone_encrypted, phone_hash")
      .eq("profile_id", profile.id)
      .is("phone_hash", null);

    if (legacyClientsError) {
      return { success: false, message: "Не получилось найти клиента." };
    }

    const matchedLegacyClient = (legacyClients ?? []).find((client) => {
      const encryptedPhoneValue =
        typeof client.phone_encrypted === "string" ? client.phone_encrypted : "";

      return decryptPhone(encryptedPhoneValue) === storedPhone;
    });

    if (matchedLegacyClient) {
      resolvedClientId = String(matchedLegacyClient.id);
    }
  }

  if (resolvedClientId) {
    const { error: updateClientError } = await admin
      .from("clients")
      .update({
        name: parsed.data.name,
        phone_encrypted: encryptedPhone,
        phone_hash: phoneHash,
        last_booking_at: startsAtIso,
      })
      .eq("id", resolvedClientId)
      .eq("profile_id", profile.id);

    if (updateClientError) {
      return { success: false, message: "Не получилось обновить клиента." };
    }
  } else {
    const { data: insertedClient, error: insertClientError } = await admin
      .from("clients")
      .insert({
        profile_id: profile.id,
        name: parsed.data.name,
        phone_encrypted: encryptedPhone,
        phone_hash: phoneHash,
        phone_last4: phoneLast4(storedPhone),
        notes: "",
        last_booking_at: startsAtIso,
      })
      .select("id")
      .single();

    if (insertClientError || !insertedClient) {
      return { success: false, message: "Не получилось создать клиента." };
    }

    resolvedClientId = String(insertedClient.id);
  }

  const cancellationDeadlineIso =
    getCancellationDeadlineIso({
      startsAtIso,
      cancellationNoticeHours: profile.cancellationNoticeHours,
    }) ?? startsAtIso;

  const { error: insertBookingError } = await admin.from("bookings").insert({
    profile_id: profile.id,
    client_id: resolvedClientId,
    service_id: String(serviceRow.id),
    status: "confirmed",
    starts_at: startsAtIso,
    ends_at: endsAtIso,
    source: "manual",
    client_note: parsed.data.note,
    cancellation_token_expires_at: cancellationDeadlineIso,
  });

  if (insertBookingError) {
    return { success: false, message: "Не получилось создать запись." };
  }

  revalidateBookingPaths(profile.username);

  return { success: true, message: "Запись добавлена в календарь." };
}

export async function cancelBookingByMasterAction(
  _prevState: BookingOperationActionState,
  formData: FormData,
) {
  const profile = await requireProfile();

  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = bookingIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, message: "Не удалось определить запись." };
  }

  const cancelledAt = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const booking = mockBookings.find(
      (item) => item.id === parsed.data.bookingId && item.profileId === profile.id,
    );

    if (!booking) {
      return { success: false, message: "Запись не найдена." };
    }

    if (booking.status !== "confirmed") {
      return { success: false, message: "Эта запись уже не активна." };
    }

    booking.status = "cancelled_by_master";
    booking.cancelledAt = cancelledAt;
    revalidateBookingPaths(profile.username);

    return { success: true, message: "Запись отменена." };
  }

  const admin = createSupabaseAdminClient();
  const { data: updatedBooking, error } = await admin
    .from("bookings")
    .update({
      status: "cancelled_by_master",
      cancelled_at: cancelledAt,
    })
    .eq("id", parsed.data.bookingId)
    .eq("profile_id", profile.id)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, message: "Не получилось отменить запись." };
  }

  if (!updatedBooking) {
    return { success: false, message: "Эта запись уже не активна." };
  }

  revalidateBookingPaths(profile.username);

  return { success: true, message: "Запись отменена." };
}

export async function updateClientNotesAction(
  _prevState: BookingOperationActionState,
  formData: FormData,
) {
  const profile = await requireProfile();

  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = clientNotesSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, message: "Не удалось сохранить заметку." };
  }

  if (!isSupabaseConfigured) {
    const client = mockClients.find(
      (item) => item.id === parsed.data.clientId && item.profileId === profile.id,
    );

    if (!client) {
      return { success: false, message: "Клиент не найден." };
    }

    client.notes = parsed.data.notes;
    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return { success: true, message: "Заметка сохранена." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("clients")
    .update({ notes: parsed.data.notes })
    .eq("id", parsed.data.clientId)
    .eq("profile_id", profile.id);

  if (error) {
    return { success: false, message: "Не получилось сохранить заметку." };
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { success: true, message: "Заметка сохранена." };
}
