import { cache } from "react";
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
import {
  decryptPhone,
  humanizeBookingDate,
  isCancellationAllowed,
} from "@/lib/booking";
import { normalizeBookingThemePresetId } from "@/lib/booking-theme-presets";
import { ensureWorkRuntime, isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { getMockBookingConfirmation } from "@/lib/mock-booking-confirmations";
import {
  defaultAvatarUrl,
  getStoredProfileMediaPath,
  parsePortfolioWorks,
  resolveProfileMediaUrl,
} from "@/lib/profile-media";
import {
  getOwnerClientsRows,
  getOwnerDashboardRows,
  getOwnerNotificationRows,
  getOwnerProfileRow,
  getOwnerScheduleRows,
  getOwnerSettingsRows,
} from "@/lib/repositories/owner-repository";
import { getWorkspaceTeamRows } from "@/lib/repositories/team-repository";
import { buildBookingSlotsForService } from "@/lib/slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isRetryableSupabaseNetworkError } from "@/lib/supabase/auth-errors";
import {
  canManageWorkspace,
  getAccountStatusLabel,
  getAccountRoleLabel,
  getWorkspaceKindLabel,
  isAccountActive,
  isTeamWorkspaceKind,
  normalizeAccountRole,
  normalizeAccountStatus,
  normalizeWorkspaceKind,
  type AccountRole,
  type AccountStatus,
  type WorkspaceKind,
} from "@/lib/workspace";

export type AccountNotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "neutral" | "success" | "accent" | "warning";
  createdAt: string;
  createdAtLabel: string;
};

export type TeamWorkspaceSummary = {
  id: string;
  name: string;
  kind: WorkspaceKind;
  kindLabel: string;
  memberCount: number;
  activeMemberCount: number;
  disabledMemberCount: number;
  staffCount: number;
  bookingsTodayCount: number;
  upcomingBookingsCount: number;
  clientCount: number;
};

export type TeamMemberSummary = {
  id: string;
  fullName: string;
  specialty: string;
  username: string;
  email: string;
  timezone: string;
  accountRole: AccountRole;
  roleLabel: string;
  accountStatus: AccountStatus;
  statusLabel: string;
  clientCount: number;
  activeServicesCount: number;
  upcomingBookingsCount: number;
  nextBookingLabel: string | null;
  joinedAtLabel: string;
};

export type TeamUpcomingBookingItem = {
  id: string;
  memberName: string;
  memberUsername: string;
  clientName: string;
  serviceTitle: string;
  startsAtLabel: string;
  sourceLabel: string;
};

export type TeamRecentClientItem = {
  id: string;
  name: string;
  phoneMasked: string;
  memberName: string;
  memberUsername: string;
  lastVisitLabel: string;
  notes: string;
};

export type TeamDashboardData = {
  profile: Profile;
  workspace: TeamWorkspaceSummary;
  members: TeamMemberSummary[];
  upcomingBookings: TeamUpcomingBookingItem[];
  recentClients: TeamRecentClientItem[];
  source: "supabase";
};

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
      resolveProfileMediaUrl(String(row.avatar_url ?? "")) || defaultAvatarUrl,
    avatarPath: getStoredProfileMediaPath(String(row.avatar_url ?? "")),
    portfolioWorks: parsePortfolioWorks(row.portfolio_works),
    bookingThemePresetId: normalizeBookingThemePresetId(row.booking_theme_preset),
    subscriptionTier: row.subscription_tier === "pro" ? "pro" : "free",
    monthlyBookingLimit: Number(row.monthly_booking_limit ?? 50),
    monthlyBookingsUsed: 0,
    bookingWindowDays: Number(row.booking_window_days ?? 30),
    slotIntervalMinutes: Number(row.slot_interval_minutes ?? 30),
    bufferMinutes: Number(row.buffer_minutes ?? 15),
    cancellationNoticeHours: Number(row.cancellation_notice_hours ?? 2),
    clientReminderHours: Number(row.client_reminder_hours ?? 24),
    masterReminderHours: Number(row.master_reminder_hours ?? 2),
    joinedAt: String(row.created_at),
    workspaceId: String(row.workspace_id ?? row.id),
    workspaceName: String(row.workspace_name ?? row.full_name ?? "okno"),
    workspaceKind: normalizeWorkspaceKind(row.workspace_kind),
    accountRole: normalizeAccountRole(row.account_role),
    accountStatus: normalizeAccountStatus(row.account_status),
    createdByProfileId: row.created_by_profile_id
      ? String(row.created_by_profile_id)
      : null,
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
  const source = (row.source === "manual" ? "manual" : "public_page") as
    | "manual"
    | "public_page";

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
    source,
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
    type:
      row.type === "sms_confirmation"
        ? "sms_confirmation"
        : row.type === "sms_reminder_client"
          ? "sms_reminder_client"
          : row.type === "telegram_reminder_master"
            ? "telegram_reminder_master"
            : "telegram_new_booking",
    status:
      row.status === "sent"
        ? "sent"
        : row.status === "failed"
          ? "failed"
          : row.status === "processing"
            ? "processing"
            : row.status === "cancelled"
              ? "cancelled"
              : "queued",
    target: String(row.target),
    createdAt: String(row.created_at),
  };
}

function formatNotificationMoment(createdAt: string, timezone: string) {
  return DateTime.fromISO(createdAt, { zone: "utc" })
    .setZone(timezone)
    .setLocale("ru")
    .toFormat("d LLLL, HH:mm");
}

function formatTeamMoment(createdAt: string, timezone: string) {
  return DateTime.fromISO(createdAt, { zone: "utc" })
    .setZone(timezone)
    .setLocale("ru")
    .toFormat("d LLLL, HH:mm");
}

function formatTeamJoinDate(createdAt: string, timezone: string) {
  return DateTime.fromISO(createdAt, { zone: "utc" })
    .setZone(timezone)
    .setLocale("ru")
    .toFormat("d LLLL yyyy");
}

function buildAccountNotificationItems(input: {
  profile: Profile;
  notificationEvents: Array<ReturnType<typeof mapNotificationEvent>>;
  monthlyBookingsUsed: number;
}) {
  const { profile, notificationEvents, monthlyBookingsUsed } = input;
  const remainingBookings = Math.max(
    0,
    profile.monthlyBookingLimit - monthlyBookingsUsed,
  );
  const stableSystemIso =
    DateTime.now()
      .setZone(profile.timezone)
      .startOf("day")
      .toUTC()
      .toISO() ?? new Date().toISOString();

  const eventItems: AccountNotificationItem[] = notificationEvents.map((event) => ({
    id: `event-${event.id}`,
    title:
      event.type === "telegram_new_booking"
        ? "Новая запись"
        : event.type === "telegram_reminder_master"
          ? "Напоминание мастеру"
          : event.type === "sms_reminder_client"
            ? "Напоминание клиенту"
        : "Подтверждение отправлено",
    description:
      event.type === "telegram_new_booking"
        ? "Появилась новая запись. Проверь кабинет и при необходимости свяжись с клиентом."
        : event.type === "telegram_reminder_master"
          ? "Напоминание о визите доставлено мастеру в Telegram."
          : event.type === "sms_reminder_client"
            ? `Напоминание о визите отправлено клиенту на ${event.target}.`
        : `Подтверждение по записи отправлено на ${event.target}.`,
    href:
      event.type === "telegram_new_booking" || event.type === "telegram_reminder_master"
        ? "/dashboard#today-bookings"
        : "/clients",
    tone:
      event.type === "telegram_new_booking"
        ? "accent"
        : event.type === "telegram_reminder_master"
          ? "success"
          : "neutral",
    createdAt: event.createdAt,
    createdAtLabel: formatNotificationMoment(event.createdAt, profile.timezone),
  }));

  const systemItems: AccountNotificationItem[] = [];

  if (!profile.telegramChatId) {
    systemItems.push({
      id: "system-telegram",
      title: "Подключи Telegram",
      description:
        "Так ты быстрее увидишь новые записи и системные подсказки по кабинету.",
      href: "/settings",
      tone: "warning",
      createdAt: stableSystemIso,
      createdAtLabel: "Сегодня",
    });
  }

  if (remainingBookings <= 10) {
    systemItems.push({
      id: "system-limit",
      title:
        remainingBookings > 0 ? "Лимит скоро закончится" : "Лимит закончился",
      description:
        remainingBookings > 0
          ? `Осталось ${remainingBookings} записей в этом месяце. Можно заранее посмотреть переход на Pro.`
          : "В этом месяце бесплатный лимит исчерпан. Самое время показать апгрейд без давления.",
      href: "/pricing",
      tone: remainingBookings > 0 ? "warning" : "accent",
      createdAt: stableSystemIso,
      createdAtLabel: "Сегодня",
    });
  }

  return [...systemItems, ...eventItems].slice(0, 8);
}

export async function getPublicPageData(username: string) {
  if (!isSupabaseConfigured) {
    ensureWorkRuntime("публичная страница мастера");
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
    if (isRetryableSupabaseNetworkError(profileError)) {
      throw new Error(
        "Нет связи с публичной страницей мастера. Проверь Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить профиль мастера.");
  }

  if (!profileRow) notFound();
  if (!isAccountActive(normalizeAccountStatus(profileRow.account_status))) {
    notFound();
  }

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
    if (
      [
        serviceResult.error,
        availabilityResult.error,
        blockedResult.error,
        bookingResult.error,
      ].some((error) => isRetryableSupabaseNetworkError(error))
    ) {
      throw new Error(
        "Нет связи с публичной страницей мастера. Проверь Supabase и попробуй еще раз.",
      );
    }

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

export const getCurrentAuthProfile = cache(async function getCurrentAuthProfile() {
  if (!isSupabaseConfigured) {
    if (isDemoMode) {
      return { profile: mockProfile, source: "mock" as const };
    }

    return null;
  }

  const profileRow = await getOwnerProfileRow();

  if (!profileRow) return null;

  const mappedProfile = mapProfile(profileRow);
  if (!isAccountActive(mappedProfile.accountStatus)) {
    return null;
  }

  return {
    profile: mappedProfile,
    source: "supabase" as const,
  };
});

export async function getAccountNotificationPanelData(input: {
  profile: Profile;
  source: "mock" | "supabase";
}) {
  if (input.source === "mock") {
    return {
      storageKey: `okno.notifications.last-seen.${input.profile.id}`,
      items: buildAccountNotificationItems({
        profile: input.profile,
        notificationEvents,
        monthlyBookingsUsed: input.profile.monthlyBookingsUsed,
      }),
    };
  }

  const notificationData = await getOwnerNotificationRows({
    profileId: input.profile.id,
    timezone: input.profile.timezone,
  });

  return {
    storageKey: `okno.notifications.last-seen.${input.profile.id}`,
    items: buildAccountNotificationItems({
      profile: input.profile,
      notificationEvents: notificationData.notificationEvents.map((row) =>
        mapNotificationEvent(row),
      ),
      monthlyBookingsUsed: notificationData.monthlyBookingsUsed,
    }),
  };
}

export async function getDashboardData() {
  const authProfile = await getCurrentAuthProfile();

  if (!authProfile) {
    if (!isSupabaseConfigured && isDemoMode) {
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

  const dashboardData = await getOwnerDashboardRows({
    profileId: authProfile.profile.id,
    timezone: authProfile.profile.timezone,
  });

  return {
    profile: {
      ...authProfile.profile,
      monthlyBookingsUsed: dashboardData.monthlyBookingsUsed,
    },
    services: dashboardData.services.map((row) => mapService(row)),
    bookings: dashboardData.bookings.map((row) => mapBooking(row)),
    clients: dashboardData.clients.map((row) => mapClient(row)),
    source: "supabase" as const,
  };
}

export async function getScheduleData() {
  const authProfile = await getCurrentAuthProfile();

  if (!authProfile) {
    if (!isSupabaseConfigured && isDemoMode) {
      return {
        profile: mockProfile,
        bookings,
        availabilityRules,
        blockedSlots,
        source: "mock" as const,
      };
    }

    return null;
  }

  if (authProfile.source === "mock") {
    return {
      profile: authProfile.profile,
      bookings,
      availabilityRules,
      blockedSlots,
      source: "mock" as const,
    };
  }

  const scheduleData = await getOwnerScheduleRows({
    profileId: authProfile.profile.id,
  });

  return {
    profile: authProfile.profile,
    bookings: scheduleData.bookings.map((row) => mapBooking(row)),
    availabilityRules: scheduleData.availabilityRules.map((row) =>
      mapAvailabilityRule(row),
    ),
    blockedSlots: scheduleData.blockedSlots.map((row) => mapBlockedSlot(row)),
    source: "supabase" as const,
  };
}

export async function getClientsData() {
  const authProfile = await getCurrentAuthProfile();

  if (!authProfile) {
    if (!isSupabaseConfigured && isDemoMode) {
      return {
        profile: mockProfile,
        services: mockServices,
        bookings,
        clients,
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
      source: "mock" as const,
    };
  }

  const clientsData = await getOwnerClientsRows({
    profileId: authProfile.profile.id,
  });

  return {
    profile: authProfile.profile,
    services: clientsData.services.map((row) => mapService(row)),
    bookings: clientsData.bookings.map((row) => mapBooking(row)),
    clients: clientsData.clients.map((row) => mapClient(row)),
    source: "supabase" as const,
  };
}

export async function getSettingsData() {
  const authProfile = await getCurrentAuthProfile();

  if (!authProfile) {
    if (!isSupabaseConfigured && isDemoMode) {
      return {
        profile: mockProfile,
        services: mockServices,
        availabilityRules,
        source: "mock" as const,
      };
    }

    return null;
  }

  if (authProfile.source === "mock") {
    return {
      profile: authProfile.profile,
      services: mockServices,
      availabilityRules,
      source: "mock" as const,
    };
  }

  const settingsData = await getOwnerSettingsRows({
    profileId: authProfile.profile.id,
  });

  return {
    profile: authProfile.profile,
    services: settingsData.services.map((row) => mapService(row)),
    availabilityRules: settingsData.availabilityRules.map((row) =>
      mapAvailabilityRule(row),
    ),
    source: "supabase" as const,
  };
}

export async function getTeamDashboardData(): Promise<TeamDashboardData | null> {
  const authProfile = await getCurrentAuthProfile();

  if (!authProfile || authProfile.source === "mock") {
    return null;
  }

  const profile = authProfile.profile;

  if (
    !canManageWorkspace(profile.accountRole) ||
    !isTeamWorkspaceKind(profile.workspaceKind)
  ) {
    return null;
  }

  const teamRows = await getWorkspaceTeamRows({
    workspaceId: profile.workspaceId,
  });

  const members = teamRows.members.map((row) => mapProfile(row));
  const services = teamRows.services.map((row) => mapService(row));
  const bookings = teamRows.bookings.map((row) => mapBooking(row));
  const clients = teamRows.clients.map((row) => mapClient(row));
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const timezone = profile.timezone;
  const now = DateTime.now().setZone(timezone);
  const todayKey = now.toFormat("yyyy-MM-dd");
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const upcomingConfirmedBookings = confirmedBookings.filter((booking) => {
    const startsAt = DateTime.fromISO(booking.startsAt, { zone: "utc" }).setZone(
      timezone,
    );
    return startsAt.toMillis() >= now.toMillis();
  });
  const bookingsTodayCount = confirmedBookings.filter((booking) => {
    const startsAt = DateTime.fromISO(booking.startsAt, { zone: "utc" }).setZone(
      timezone,
    );
    return startsAt.toFormat("yyyy-MM-dd") === todayKey;
  }).length;

  const teamMembers = members
    .map((member) => {
      const memberBookings = upcomingConfirmedBookings.filter(
        (booking) => booking.profileId === member.id,
      );
      const nextBooking = memberBookings[0] ?? null;
      const activeServicesCount = services.filter(
        (service) => service.profileId === member.id && service.isActive,
      ).length;
      const clientCount = clients.filter((client) => client.profileId === member.id).length;

      return {
        id: member.id,
        fullName: member.fullName,
        specialty: member.specialty,
        username: member.username,
        email: member.email,
        timezone: member.timezone,
        accountRole: member.accountRole,
        roleLabel: getAccountRoleLabel(member.accountRole),
        accountStatus: member.accountStatus,
        statusLabel: getAccountStatusLabel(member.accountStatus),
        clientCount,
        activeServicesCount,
        upcomingBookingsCount: memberBookings.length,
        nextBookingLabel: nextBooking
          ? formatTeamMoment(nextBooking.startsAt, timezone)
          : null,
        joinedAtLabel: formatTeamJoinDate(member.joinedAt, timezone),
      } satisfies TeamMemberSummary;
    })
    .sort((left, right) => {
      if (left.accountRole !== right.accountRole) {
        if (left.accountRole === "admin") return -1;
        if (right.accountRole === "admin") return 1;
      }

      return left.fullName.localeCompare(right.fullName, "ru");
    });

  const upcomingBookings = upcomingConfirmedBookings
    .slice(0, 10)
    .map((booking) => {
      const member = memberMap.get(booking.profileId);
      const client = clientMap.get(booking.clientId);
      const service = serviceMap.get(booking.serviceId);

      return {
        id: booking.id,
        memberName: member?.fullName ?? "Сотрудник",
        memberUsername: member?.username ?? "",
        clientName: client?.name ?? "Клиент",
        serviceTitle: service?.title ?? "Услуга",
        startsAtLabel: formatTeamMoment(booking.startsAt, timezone),
        sourceLabel: booking.source === "manual" ? "Добавил администратор" : "Онлайн-запись",
      } satisfies TeamUpcomingBookingItem;
    });

  const recentClients = [...clients]
    .sort((left, right) => {
      const leftMoment = left.lastBookingAt || left.createdAt;
      const rightMoment = right.lastBookingAt || right.createdAt;
      return rightMoment.localeCompare(leftMoment);
    })
    .slice(0, 10)
    .map((client) => {
      const member = memberMap.get(client.profileId);

      return {
        id: client.id,
        name: client.name,
        phoneMasked: client.phoneMasked,
        memberName: member?.fullName ?? "Сотрудник",
        memberUsername: member?.username ?? "",
        lastVisitLabel: formatTeamMoment(client.lastBookingAt, timezone),
        notes: client.notes,
      } satisfies TeamRecentClientItem;
    });

  return {
    profile,
    workspace: {
      id: profile.workspaceId,
      name: profile.workspaceName,
      kind: profile.workspaceKind,
      kindLabel: getWorkspaceKindLabel(profile.workspaceKind),
      memberCount: members.length,
      activeMemberCount: members.filter((member) =>
        isAccountActive(member.accountStatus),
      ).length,
      disabledMemberCount: members.filter(
        (member) => !isAccountActive(member.accountStatus),
      ).length,
      staffCount: members.filter((member) => member.accountRole === "staff").length,
      bookingsTodayCount,
      upcomingBookingsCount: upcomingConfirmedBookings.length,
      clientCount: clients.length,
    },
    members: teamMembers,
    upcomingBookings,
    recentClients,
    source: "supabase",
  };
}

export function getPricingData() {
  return pricingPlans;
}

export async function getBookingConfirmationData(
  username: string,
  bookingId: string,
) {
  if (!bookingId) {
    return null;
  }

  if (!isSupabaseConfigured) {
    ensureWorkRuntime("подтверждение записи");
    if (username !== mockProfile.username) {
      return null;
    }

    const booking = getMockBookingConfirmation(bookingId);

    if (!booking || booking.username !== username) {
      return null;
    }

    return {
      clientName: booking.clientName,
      serviceTitle: booking.serviceTitle,
      startsAtLabel: humanizeBookingDate({
        startsAtIso: booking.startsAtIso,
        timezone: mockProfile.timezone,
      }),
      cancellationToken: booking.cancellationToken,
      themePresetId: mockProfile.bookingThemePresetId,
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: profileRow, error: profileError } = await admin
    .from("profiles")
    .select("id, timezone, booking_theme_preset")
    .eq("username", username)
    .maybeSingle();

  if (profileError) {
    if (isRetryableSupabaseNetworkError(profileError)) {
      throw new Error(
        "Нет связи с подтверждением записи. Проверь Supabase и попробуй еще раз.",
      );
    }

    throw new Error("Не получилось загрузить профиль мастера.");
  }

  if (!profileRow) {
    return null;
  }

  const { data: bookingRow, error: bookingError } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("profile_id", profileRow.id)
    .maybeSingle();

  if (bookingError) {
    throw new Error("Не получилось загрузить запись.");
  }

  if (!bookingRow) {
    return null;
  }

  const [{ data: clientRow, error: clientError }, { data: serviceRow, error: serviceError }] =
    await Promise.all([
      admin
        .from("clients")
        .select("name")
        .eq("id", bookingRow.client_id)
        .maybeSingle(),
      admin
        .from("services")
        .select("title")
        .eq("id", bookingRow.service_id)
        .maybeSingle(),
    ]);

  if (clientError || serviceError) {
    throw new Error("Не получилось собрать подтверждение записи.");
  }

  if (!clientRow || !serviceRow) {
    return null;
  }

  return {
    clientName: String(clientRow.name),
    serviceTitle: String(serviceRow.title),
    startsAtLabel: humanizeBookingDate({
      startsAtIso: String(bookingRow.starts_at),
      timezone: String(profileRow.timezone ?? "Europe/Simferopol"),
    }),
    cancellationToken: String(bookingRow.cancellation_token ?? ""),
    themePresetId: normalizeBookingThemePresetId(profileRow.booking_theme_preset),
  };
}

export async function getBookingCancellationData(cancellationToken: string) {
  if (!cancellationToken) {
    return null;
  }

  if (!isSupabaseConfigured) {
    ensureWorkRuntime("отмена записи клиентом");

    const booking = bookings.find((item) => item.cancellationToken === cancellationToken);
    if (!booking) {
      return null;
    }

    const client = clients.find((item) => item.id === booking.clientId);
    const service = mockServices.find((item) => item.id === booking.serviceId);

    if (!client || !service) {
      return null;
    }

    const canCancel = isCancellationAllowed({
      startsAtIso: booking.startsAt,
      cancellationTokenExpiresAt: booking.cancellationTokenExpiresAt,
      timezone: mockProfile.timezone,
      status: booking.status,
    });

    return {
      bookingId: booking.id,
      cancellationToken: booking.cancellationToken,
      clientName: client.name,
      serviceTitle: service.title,
      serviceId: service.id,
      serviceDurationMinutes: service.durationMinutes,
      masterName: mockProfile.fullName,
      timezone: mockProfile.timezone,
      startsAtLabel: humanizeBookingDate({
        startsAtIso: booking.startsAt,
        timezone: mockProfile.timezone,
      }),
      startsAtIso: booking.startsAt,
      username: mockProfile.username,
      status: booking.status,
      canCancel,
      cancellationDeadlineLabel: booking.cancellationTokenExpiresAt
        ? humanizeBookingDate({
            startsAtIso: booking.cancellationTokenExpiresAt,
            timezone: mockProfile.timezone,
          })
        : null,
      bookingSlots: buildBookingSlotsForService({
        profile: mockProfile,
        service,
        availabilityRules,
        blockedSlots,
        bookings: bookings.filter((item) => item.id !== booking.id),
      }),
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: bookingRow, error: bookingError } = await admin
    .from("bookings")
    .select("*")
    .eq("cancellation_token", cancellationToken)
    .maybeSingle();

  if (bookingError) {
    throw new Error("Не получилось загрузить запись по ссылке отмены.");
  }

  if (!bookingRow) {
    return null;
  }

  const [{ data: clientRow, error: clientError }, { data: serviceRow, error: serviceError }, { data: profileRow, error: profileError }] =
    await Promise.all([
      admin
        .from("clients")
        .select("name")
        .eq("id", bookingRow.client_id)
        .maybeSingle(),
      admin
        .from("services")
        .select("*")
        .eq("id", bookingRow.service_id)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("id, username, full_name, timezone, email, password_auth_id, specialty, bio, location_text, telegram_chat_id, avatar_url, subscription_tier, monthly_booking_limit, created_at, booking_window_days, slot_interval_minutes, buffer_minutes, cancellation_notice_hours")
        .eq("id", bookingRow.profile_id)
        .maybeSingle(),
    ]);

  if (clientError || serviceError || profileError) {
    throw new Error("Не получилось собрать данные для отмены записи.");
  }

  if (!clientRow || !serviceRow || !profileRow) {
    return null;
  }

  const timezone = String(profileRow.timezone ?? "Europe/Simferopol");
  const status = String(bookingRow.status) as
    | "confirmed"
    | "cancelled_by_client"
    | "cancelled_by_master";

  const [availabilityResult, blockedResult, bookingResult] = await Promise.all([
    admin
      .from("availability_rules")
      .select("*")
      .eq("profile_id", profileRow.id)
      .order("weekday"),
    admin
      .from("blocked_slots")
      .select("*")
      .eq("profile_id", profileRow.id)
      .order("starts_at"),
    admin
      .from("bookings")
      .select("*")
      .eq("profile_id", profileRow.id)
      .eq("status", "confirmed")
      .neq("id", bookingRow.id)
      .order("starts_at"),
  ]);

  if (availabilityResult.error || blockedResult.error || bookingResult.error) {
    throw new Error("Не получилось загрузить свободное время для переноса записи.");
  }

  const mappedProfile = mapProfile(profileRow);
  const mappedService = mapService(serviceRow);

  return {
    bookingId: String(bookingRow.id),
    cancellationToken: String(bookingRow.cancellation_token),
    clientName: String(clientRow.name),
    serviceTitle: String(serviceRow.title),
    serviceId: String(serviceRow.id),
    serviceDurationMinutes: Number(serviceRow.duration_minutes),
    masterName: String(profileRow.full_name),
    timezone,
    startsAtLabel: humanizeBookingDate({
      startsAtIso: String(bookingRow.starts_at),
      timezone,
    }),
    startsAtIso: String(bookingRow.starts_at),
    username: String(profileRow.username),
    status,
    canCancel: isCancellationAllowed({
      startsAtIso: String(bookingRow.starts_at),
      cancellationTokenExpiresAt: bookingRow.cancellation_token_expires_at
        ? String(bookingRow.cancellation_token_expires_at)
        : null,
      timezone,
      status,
    }),
    cancellationDeadlineLabel: bookingRow.cancellation_token_expires_at
      ? humanizeBookingDate({
          startsAtIso: String(bookingRow.cancellation_token_expires_at),
          timezone,
        })
      : null,
    bookingSlots: buildBookingSlotsForService({
      profile: mappedProfile,
      service: mappedService,
      availabilityRules: (availabilityResult.data ?? []).map((row) =>
        mapAvailabilityRule(row),
      ),
      blockedSlots: (blockedResult.data ?? []).map((row) => mapBlockedSlot(row)),
      bookings: (bookingResult.data ?? []).map((row) => mapBooking(row)),
    }),
  };
}
