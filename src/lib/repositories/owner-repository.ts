import { DateTime } from "luxon";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isNonFatalSupabaseSessionError,
  isRetryableSupabaseNetworkError,
} from "@/lib/supabase/auth-errors";

type Row = Record<string, unknown>;

function buildMonthRange(timezone: string) {
  const monthStart = DateTime.now().setZone(timezone).startOf("month");
  const monthEnd = monthStart.plus({ months: 1 });

  return {
    monthStartUtc: monthStart.toUTC().toISO() ?? new Date().toISOString(),
    monthEndUtc: monthEnd.toUTC().toISO() ?? new Date().toISOString(),
  };
}

export async function getOwnerProfileRow() {
  const supabase = await createSupabaseServerClient();
  let user: { id: string } | null = null;
  let userError: unknown = null;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user ? { id: result.data.user.id } : null;
    userError = result.error;
  } catch (error) {
    if (isNonFatalSupabaseSessionError(error)) {
      return null;
    }

    throw error;
  }

  if (userError) {
    if (isNonFatalSupabaseSessionError(userError)) {
      return null;
    }

    throw new Error("Не получилось проверить сессию кабинета.");
  }

  if (!user) {
    return null;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("password_auth_id", user.id)
    .maybeSingle();

  if (profileError) {
    if (isRetryableSupabaseNetworkError(profileError)) {
      throw new Error(
        "Нет связи с кабинетом. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить профиль мастера.");
  }

  return (profileRow ?? null) as Row | null;
}

export async function getOwnerDashboardRows(input: {
  profileId: string;
  timezone: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { monthStartUtc, monthEndUtc } = buildMonthRange(input.timezone);

  const [serviceResult, bookingResult, clientResult, monthlyBookingsUsedResult] =
    await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("profile_id", input.profileId)
        .order("sort_order"),
      supabase
        .from("bookings")
        .select("*")
        .eq("profile_id", input.profileId)
        .eq("status", "confirmed")
        .order("starts_at"),
      supabase
        .from("clients")
        .select("*")
        .eq("profile_id", input.profileId)
        .order("last_booking_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", input.profileId)
        .eq("status", "confirmed")
        .or(
          `and(starts_at.gte.${monthStartUtc},starts_at.lt.${monthEndUtc}),and(created_at.gte.${monthStartUtc},created_at.lt.${monthEndUtc})`,
        ),
    ]);

  if (
    serviceResult.error ||
    bookingResult.error ||
    clientResult.error ||
    monthlyBookingsUsedResult.error
  ) {
    if (
      [
        serviceResult.error,
        bookingResult.error,
        clientResult.error,
        monthlyBookingsUsedResult.error,
      ].some((error) => isRetryableSupabaseNetworkError(error))
    ) {
      throw new Error(
        "Нет связи с кабинетом. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить данные кабинета.");
  }

  return {
    services: (serviceResult.data ?? []) as Row[],
    bookings: (bookingResult.data ?? []) as Row[],
    clients: (clientResult.data ?? []) as Row[],
    monthlyBookingsUsed: monthlyBookingsUsedResult.count ?? 0,
  };
}

export async function getOwnerScheduleRows(input: { profileId: string }) {
  const supabase = await createSupabaseServerClient();

  const [bookingResult, availabilityResult, blockedResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .eq("profile_id", input.profileId)
      .eq("status", "confirmed")
      .order("starts_at"),
    supabase
      .from("availability_rules")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("weekday"),
    supabase
      .from("blocked_slots")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("starts_at"),
  ]);

  if (bookingResult.error || availabilityResult.error || blockedResult.error) {
    if (
      [
        bookingResult.error,
        availabilityResult.error,
        blockedResult.error,
      ].some((error) => isRetryableSupabaseNetworkError(error))
    ) {
      throw new Error(
        "Нет связи с кабинетом. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить расписание кабинета.");
  }

  return {
    bookings: (bookingResult.data ?? []) as Row[],
    availabilityRules: (availabilityResult.data ?? []) as Row[],
    blockedSlots: (blockedResult.data ?? []) as Row[],
  };
}

export async function getOwnerClientsRows(input: { profileId: string }) {
  const supabase = await createSupabaseServerClient();

  const [serviceResult, bookingResult, clientResult] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("sort_order"),
    supabase
      .from("bookings")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("starts_at"),
    supabase
      .from("clients")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("last_booking_at", { ascending: false }),
  ]);

  if (serviceResult.error || bookingResult.error || clientResult.error) {
    if (
      [serviceResult.error, bookingResult.error, clientResult.error].some((error) =>
        isRetryableSupabaseNetworkError(error),
      )
    ) {
      throw new Error(
        "Нет связи с кабинетом. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить клиентов кабинета.");
  }

  return {
    services: (serviceResult.data ?? []) as Row[],
    bookings: (bookingResult.data ?? []) as Row[],
    clients: (clientResult.data ?? []) as Row[],
  };
}

export async function getOwnerSettingsRows(input: { profileId: string }) {
  const supabase = await createSupabaseServerClient();

  const [serviceResult, availabilityResult] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("sort_order"),
    supabase
      .from("availability_rules")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("weekday"),
  ]);

  if (serviceResult.error || availabilityResult.error) {
    if (
      [serviceResult.error, availabilityResult.error].some((error) =>
        isRetryableSupabaseNetworkError(error),
      )
    ) {
      throw new Error(
        "Нет связи с кабинетом. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить настройки кабинета.");
  }

  return {
    services: (serviceResult.data ?? []) as Row[],
    availabilityRules: (availabilityResult.data ?? []) as Row[],
  };
}

export async function getOwnerNotificationRows(input: {
  profileId: string;
  timezone: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { monthStartUtc, monthEndUtc } = buildMonthRange(input.timezone);

  const [notificationResult, monthlyBookingsUsedResult] = await Promise.all([
    supabase
      .from("notification_events")
      .select("*")
      .eq("profile_id", input.profileId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", input.profileId)
      .eq("status", "confirmed")
      .or(
        `and(starts_at.gte.${monthStartUtc},starts_at.lt.${monthEndUtc}),and(created_at.gte.${monthStartUtc},created_at.lt.${monthEndUtc})`,
      ),
  ]);

  if (notificationResult.error || monthlyBookingsUsedResult.error) {
    if (
      isRetryableSupabaseNetworkError(notificationResult.error) ||
      isRetryableSupabaseNetworkError(monthlyBookingsUsedResult.error)
    ) {
      throw new Error(
        "Нет связи с кабинетом. Проверь подключение к Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить уведомления кабинета.");
  }

  return {
    notificationEvents: (notificationResult.data ?? []) as Row[],
    monthlyBookingsUsed: monthlyBookingsUsedResult.count ?? 0,
  };
}
