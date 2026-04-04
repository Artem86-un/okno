"use server";

import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentAuthProfile } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  success: boolean;
  message: string;
};

const profileSchema = z.object({
  fullName: z.string().trim().min(2),
  specialty: z.string().trim().min(2),
  locationText: z.string().trim().default(""),
  timezone: z.string().trim().min(3),
  bio: z.string().trim().default(""),
});

const preferencesSchema = z.object({
  bookingWindowDays: z.coerce.number().min(1).max(365),
  slotIntervalMinutes: z.coerce.number().min(5).max(180),
  bufferMinutes: z.coerce.number().min(0).max(180),
  cancellationNoticeHours: z.coerce.number().min(0).max(168),
});

const accessSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(8),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

const blockedSlotSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  reason: z.string().trim().default(""),
});

async function requireProfile() {
  if (!isSupabaseConfigured) return null;

  const authProfile = await getCurrentAuthProfile();

  return authProfile?.profile ?? null;
}

export async function updateProfileAction(
  _prevState: SettingsActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Для сохранения профиля нужно подключение к Supabase.",
    };
  }

  const profile = await requireProfile();
  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message:
        "Проверь профиль: имя и ниша должны быть заполнены, остальные поля можно оставить пустыми.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      specialty: parsed.data.specialty,
      location_text: parsed.data.locationText,
      timezone: parsed.data.timezone,
      bio: parsed.data.bio,
    })
    .eq("id", profile.id);

  if (error) {
    return {
      success: false,
      message: `Не получилось обновить профиль.${error.message ? ` ${error.message}` : ""}`,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.username}`);

  return { success: true, message: "Профиль обновлен." };
}

export async function updateBookingPreferencesAction(
  _prevState: SettingsActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Для сохранения настроек записи нужно подключение к Supabase.",
    };
  }

  const profile = await requireProfile();
  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = preferencesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Проверь настройки записи." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      booking_window_days: parsed.data.bookingWindowDays,
      slot_interval_minutes: parsed.data.slotIntervalMinutes,
      buffer_minutes: parsed.data.bufferMinutes,
      cancellation_notice_hours: parsed.data.cancellationNoticeHours,
    })
    .eq("id", profile.id);

  if (error) {
    return {
      success: false,
      message: "Не получилось обновить параметры записи.",
    };
  }

  revalidatePath("/settings");
  return { success: true, message: "Параметры записи сохранены." };
}

export async function updateAccessAction(
  _prevState: SettingsActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Для смены email и пароля нужно подключение к Supabase.",
    };
  }

  const profile = await requireProfile();
  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = accessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Проверь email и текущий пароль." };
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const emailChanged = parsed.data.email !== profile.email;
  const passwordChanged = Boolean(parsed.data.password);

  if (!emailChanged && !passwordChanged) {
    return {
      success: false,
      message: "Нечего обновлять: измени email или введи новый пароль.",
    };
  }

  if (
    passwordChanged &&
    parsed.data.password !== parsed.data.confirmPassword
  ) {
    return {
      success: false,
      message: "Новый пароль и подтверждение не совпадают.",
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return {
      success: false,
      message: "Текущий пароль введен неверно.",
    };
  }

  const updatePayload: { email?: string; password?: string } = {
    email: parsed.data.email,
  };

  if (parsed.data.password && parsed.data.password.length >= 8) {
    updatePayload.password = parsed.data.password;
  }

  const { error: authError } = await supabase.auth.updateUser(updatePayload);
  if (authError) {
    return {
      success: false,
      message: "Не получилось обновить доступ к аккаунту.",
    };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ email: parsed.data.email })
    .eq("id", profile.id);

  if (profileError) {
    return {
      success: false,
      message: "Данные входа обновились частично. Проверь email позже.",
    };
  }

  revalidatePath("/settings");
  return { success: true, message: "Данные входа обновлены." };
}

const serviceSchema = z.object({
  title: z.string().min(2),
  description: z.string().default(""),
  durationMinutes: z.coerce.number().min(5).max(480),
  price: z.coerce.number().min(0),
  sortOrder: z.coerce.number().min(0).default(0),
});

export async function createServiceAction(
  _prevState: SettingsActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Для управления услугами нужно подключение к Supabase.",
    };
  }

  const profile = await requireProfile();
  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Проверь поля новой услуги." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("services").insert({
    profile_id: profile.id,
    title: parsed.data.title,
    description: parsed.data.description,
    duration_minutes: parsed.data.durationMinutes,
    price: parsed.data.price,
    sort_order: parsed.data.sortOrder,
    is_active: true,
  });

  if (error) {
    return { success: false, message: "Не получилось создать услугу." };
  }

  revalidatePath("/settings");
  revalidatePath(`/${profile.username}`);
  return { success: true, message: "Услуга добавлена." };
}

export async function updateServiceAction(
  _prevState: SettingsActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Для управления услугами нужно подключение к Supabase.",
    };
  }

  const profile = await requireProfile();
  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const serviceId = String(formData.get("serviceId") ?? "");
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!serviceId || !parsed.success) {
    return { success: false, message: "Проверь поля услуги." };
  }

  const visibilityAction = String(formData.get("visibilityAction") ?? "");
  const nextActive =
    visibilityAction === "hide"
      ? false
      : visibilityAction === "show"
        ? true
        : formData.get("isActive") === "on";

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("services")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      duration_minutes: parsed.data.durationMinutes,
      price: parsed.data.price,
      sort_order: parsed.data.sortOrder,
      is_active: nextActive,
    })
    .eq("id", serviceId)
    .eq("profile_id", profile.id);

  if (error) {
    return { success: false, message: "Не получилось обновить услугу." };
  }

  revalidatePath("/settings");
  revalidatePath(`/${profile.username}`);
  return { success: true, message: "Услуга обновлена." };
}

export async function updateAvailabilityAction(
  _prevState: SettingsActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Для сохранения графика нужно подключение к Supabase.",
    };
  }

  const profile = await requireProfile();
  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const rows: Array<{
    profile_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }> = [];

  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const enabled = formData.get(`active_${weekday}`) === "on";
    const start = String(formData.get(`start_${weekday}`) ?? "09:00");
    const end = String(formData.get(`end_${weekday}`) ?? "18:00");

    if (enabled) {
      rows.push({
        profile_id: profile.id,
        weekday,
        start_time: start,
        end_time: end,
        is_active: true,
      });
    }
  }

  const admin = createSupabaseAdminClient();
  const { error: deleteError } = await admin
    .from("availability_rules")
    .delete()
    .eq("profile_id", profile.id);

  if (deleteError) {
    return { success: false, message: "Не получилось обновить старый график." };
  }

  if (rows.length > 0) {
    const { error: insertError } = await admin
      .from("availability_rules")
      .insert(rows);

    if (insertError) {
      return { success: false, message: "Не получилось сохранить рабочие дни." };
    }
  }

  revalidatePath("/settings");
  revalidatePath("/schedule");
  return { success: true, message: "График работы сохранен." };
}

export async function createBlockedSlotAction(
  _prevState: SettingsActionState,
  formData: FormData,
) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Для ручных блокировок нужно подключение к Supabase.",
    };
  }

  const profile = await requireProfile();
  if (!profile) {
    return { success: false, message: "Сессия истекла. Войди заново." };
  }

  const parsed = blockedSlotSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Укажи дату, время начала и время окончания блокировки.",
    };
  }

  const startsAt = DateTime.fromISO(
    `${parsed.data.date}T${parsed.data.startTime}`,
    { zone: profile.timezone },
  );
  const endsAt = DateTime.fromISO(
    `${parsed.data.date}T${parsed.data.endTime}`,
    { zone: profile.timezone },
  );

  if (!startsAt.isValid || !endsAt.isValid || endsAt <= startsAt) {
    return {
      success: false,
      message: "Проверь диапазон времени: окончание должно быть позже начала.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("blocked_slots").insert({
    profile_id: profile.id,
    starts_at: startsAt.toUTC().toISO(),
    ends_at: endsAt.toUTC().toISO(),
    reason: parsed.data.reason || "Ручная блокировка",
  });

  if (error) {
    return {
      success: false,
      message: `Не получилось сохранить блокировку.${error.message ? ` ${error.message}` : ""}`,
    };
  }

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.username}`);
  revalidatePath(`/${profile.username}/book`);

  return {
    success: true,
    message: "Время заблокировано. Клиенты больше не увидят этот слот.",
  };
}

export async function deleteBlockedSlotAction(formData: FormData) {
  if (!isSupabaseConfigured) {
    return;
  }

  const profile = await requireProfile();
  if (!profile) {
    return;
  }

  const blockedSlotId = String(formData.get("blockedSlotId") ?? "");
  if (!blockedSlotId) {
    return;
  }

  const admin = createSupabaseAdminClient();
  await admin
    .from("blocked_slots")
    .delete()
    .eq("id", blockedSlotId)
    .eq("profile_id", profile.id);

  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.username}`);
  revalidatePath(`/${profile.username}/book`);
}
