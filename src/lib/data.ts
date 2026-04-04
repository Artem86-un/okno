import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import {
  availabilityRules,
  blockedSlots,
  bookingSlots,
  bookings,
  clients,
  notificationEvents,
  pricingPlans,
  profile as mockProfile,
  type Profile,
  services as mockServices,
} from "@/lib/mock-data";
import { decryptPhone } from "@/lib/booking";
import { isSupabaseConfigured } from "@/lib/env";
import { buildBookingSlotsForService } from "@/lib/slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordAuthId: String(row.password_auth_id),
    fullName: String(row.full_name),
    username: String(row.username),
    specialty: String(row.specialty),
    bio: String(row.bio ?? ""),
    locationText: String(row.location_text ?? ""),
    timezone: String(row.timezone ?? "Europe/Simferopol"),
    telegramChatId: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
    avatarUrl:
      String(row.avatar_url ?? "") ||
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    subscriptionTier: row.subscription_tier === "pro" ? "pro" : "free",
    monthlyBookingLimit: Number(row.monthly_booking_limit ?? 50),
    monthlyBookingsUsed: 0,
    bookingWindowDays: Number(row.booking_window_days ?? 30),
    slotIntervalMinutes: Number(row.slot_interval_minutes ?? 30),
    bufferMinutes: Number(row.buffer_minutes ?? 15),
    cancellationNoticeHours: Number(row.cancellation_notice_hours ?? 2),
    joinedAt: String(row.created_at),
  };
}

function mapService(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    durationMinutes: Number(row.duration_minutes),
    price: Number(row.price),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapClient(row: Record<string, unknown>) {
  const phone = row.phone_encrypted ? decryptPhone(String(row.phone_encrypted)) : "";
  const last4 = String(row.phone_last4 ?? "");
  const masked = phone
    ? `${phone.slice(0, Math.max(0, phone.length - 4))}${last4}`
    : `***${last4}`;

  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    name: String(row.name),
    phoneMasked: masked,
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at),
    lastBookingAt: String(row.last_booking_at ?? row.created_at),
  };
}

function mapBooking(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    clientId: String(row.client_id),
    serviceId: String(row.service_id),
    status: String(row.status) as
      | "confirmed"
      | "cancelled_by_client"
      | "cancelled_by_master",
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    source: "public_page" as const,
    clientNote: String(row.client_note ?? ""),
    cancellationToken: String(row.cancellation_token ?? ""),
    cancellationTokenExpiresAt: String(row.cancellation_token_expires_at ?? ""),
    createdAt: String(row.created_at),
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
  };
}

function mapAvailabilityRule(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    weekday: Number(row.weekday),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    isActive: Boolean(row.is_active),
  };
}

function mapBlockedSlot(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    reason: String(row.reason ?? ""),
  };
}

function mapNotificationEvent(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    type: row.type === "sms_confirmation" ? "sms_confirmation" : "telegram_new_booking",
    status: row.status === "sent" ? "sent" : "queued",
    target: String(row.target),
    createdAt: String(row.created_at),
  };
}

export async function getPublicPageData(username: string) {
  if (!isSupabaseConfigured) {
    if (username !== mockProfile.username) notFound();
    return {
      profile: mockProfile,
      services: mockServices,
      bookingSlotsByService: Object.fromEntries(
        mockServices.map((service) => [service.id, bookingSlots]),
      ) as Record<string, typeof bookingSlots>,
      source: "mock" as const,
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: profileRow, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (profileError) {
    throw new Error("Не получилось загрузить профиль мастера.");
  }

  if (!profileRow) notFound();

  const [
    serviceResult,
    availabilityResult,
    blockedResult,
    bookingResult,
  ] = await Promise.all([
    admin
      .from("services")
      .select("*")
      .eq("profile_id", profileRow.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    admin
      .from("availability_rules")
      .select("*")
      .eq("profile_id", profileRow.id)
      .order("weekday"),
    admin.from("blocked_slots").select("*").eq("profile_id", profileRow.id),
    admin
      .from("bookings")
      .select("*")
      .eq("profile_id", profileRow.id)
      .eq("status", "confirmed")
      .order("starts_at"),
  ]);

  if (
    serviceResult.error ||
    availabilityResult.error ||
    blockedResult.error ||
    bookingResult.error
  ) {
    throw new Error("Не получилось загрузить свободное время мастера.");
  }

  const mappedProfile = mapProfile(profileRow);
  const mappedServices = (serviceResult.data ?? []).map((row) => mapService(row));
  const mappedAvailability = (availabilityResult.data ?? []).map((row) =>
    mapAvailabilityRule(row),
  );
  const mappedBlockedSlots = (blockedResult.data ?? []).map((row) =>
    mapBlockedSlot(row),
  );
  const mappedBookings = (bookingResult.data ?? []).map((row) => mapBooking(row));

  const bookingSlotsByService = Object.fromEntries(
    mappedServices.map((service) => [
      service.id,
      buildBookingSlotsForService({
        profile: mappedProfile,
        service,
        availabilityRules: mappedAvailability,
        blockedSlots: mappedBlockedSlots,
        bookings: mappedBookings,
      }),
    ]),
  );

  return {
    profile: mappedProfile,
    services: mappedServices,
    bookingSlotsByService,
    source: "supabase" as const,
  };
}

export async function getCurrentAuthProfile() {
  if (!isSupabaseConfigured) {
    return { profile: mockProfile, source: "mock" as const };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("*")
    .eq("password_auth_id", user.id)
    .maybeSingle();

  if (!profileRow) return null;

  return {
    profile: mapProfile(profileRow),
    source: "supabase" as const,
  };
}

export async function getDashboardData() {
  const authProfile = await getCurrentAuthProfile();

  if (!authProfile) {
    if (!isSupabaseConfigured) {
      return {
        profile: mockProfile,
        services: mockServices,
        bookings,
        clients,
        availabilityRules,
        blockedSlots,
        notificationEvents,
        source: "mock" as const,
      };
    }

    return null;
  }

  if (authProfile.source === "mock") {
    return {
      profile: authProfile.profile,
      services: mockServices,
      bookings,
      clients,
      availabilityRules,
      blockedSlots,
      notificationEvents,
      source: "mock" as const,
    };
  }

  const admin = createSupabaseAdminClient();
  const profileId = authProfile.profile.id;

  const [
    serviceResult,
    bookingResult,
    clientResult,
    availabilityResult,
    blockedResult,
    notificationResult,
  ] = await Promise.all([
    admin.from("services").select("*").eq("profile_id", profileId).order("sort_order"),
    admin.from("bookings").select("*").eq("profile_id", profileId).order("starts_at"),
    admin
      .from("clients")
      .select("*")
      .eq("profile_id", profileId)
      .order("last_booking_at", { ascending: false }),
    admin
      .from("availability_rules")
      .select("*")
      .eq("profile_id", profileId)
      .order("weekday"),
    admin.from("blocked_slots").select("*").eq("profile_id", profileId).order("starts_at"),
    admin
      .from("notification_events")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const normalizedBookings = (bookingResult.data ?? []).map((row) => mapBooking(row));
  const normalizedClients = (clientResult.data ?? []).map((row) => mapClient(row));
  const currentMonth = DateTime.now().setZone(authProfile.profile.timezone).toFormat("yyyy-MM");

  return {
    profile: {
      ...authProfile.profile,
      monthlyBookingsUsed: normalizedBookings.filter(
        (booking) => {
          if (booking.status !== "confirmed") return false;
          const startsAtMonth = DateTime.fromISO(booking.startsAt, { zone: "utc" })
            .setZone(authProfile.profile.timezone)
            .toFormat("yyyy-MM");
          const createdAtMonth = DateTime.fromISO(booking.createdAt, { zone: "utc" })
            .setZone(authProfile.profile.timezone)
            .toFormat("yyyy-MM");
          return startsAtMonth === currentMonth || createdAtMonth === currentMonth;
        },
      ).length,
    },
    services: (serviceResult.data ?? []).map((row) => mapService(row)),
    bookings: normalizedBookings,
    clients: normalizedClients,
    availabilityRules: (availabilityResult.data ?? []).map((row) =>
      mapAvailabilityRule(row),
    ),
    blockedSlots: (blockedResult.data ?? []).map((row) => mapBlockedSlot(row)),
    notificationEvents: (notificationResult.data ?? []).map((row) =>
      mapNotificationEvent(row),
    ),
    source: "supabase" as const,
  };
}

export function getPricingData() {
  return pricingPlans;
}
