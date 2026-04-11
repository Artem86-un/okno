export type SubscriptionTier = "free" | "pro";

export type Profile = {
  id: string;
  email: string;
  passwordAuthId: string;
  fullName: string;
  username: string;
  specialty: string;
  bio: string;
  locationText: string;
  timezone: string;
  telegramChatId: string | null;
  avatarUrl: string;
  subscriptionTier: SubscriptionTier;
  monthlyBookingLimit: number;
  monthlyBookingsUsed: number;
  bookingWindowDays: number;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  cancellationNoticeHours: number;
  joinedAt: string;
};

export type Service = {
  id: string;
  profileId: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
};

export type BookingStatus =
  | "confirmed"
  | "cancelled_by_client"
  | "cancelled_by_master";

export type Client = {
  id: string;
  profileId: string;
  name: string;
  phoneMasked: string;
  notes: string;
  createdAt: string;
  lastBookingAt: string;
};

export type Booking = {
  id: string;
  profileId: string;
  clientId: string;
  serviceId: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  source: "public_page" | "manual";
  clientNote: string;
  cancellationToken: string;
  cancellationTokenExpiresAt: string;
  createdAt: string;
  cancelledAt: string | null;
};

export type AvailabilityRule = {
  id: string;
  profileId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type BlockedSlot = {
  id: string;
  profileId: string;
  startsAt: string;
  endsAt: string;
  reason: string;
};

export type NotificationEvent = {
  id: string;
  profileId: string;
  type: "sms_confirmation" | "telegram_new_booking";
  status: "sent" | "queued";
  target: string;
  createdAt: string;
};

export type BookingSlot = {
  date: string;
  value: string;
  times: string[];
};

export const profile: Profile = {
  id: "master-1",
  email: "hello@okno.app",
  passwordAuthId: "auth-1",
  fullName: "Алина Мороз",
  username: "alina-nails",
  specialty: "Маникюр и брови",
  bio: "Спокойный кабинет у метро, мягкий сервис и аккуратные записи без спешки.",
  locationText: "Симферополь, район центра",
  timezone: "Europe/Simferopol",
  telegramChatId: "@okno_master_bot",
  avatarUrl:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  subscriptionTier: "free",
  monthlyBookingLimit: 50,
  monthlyBookingsUsed: 47,
  bookingWindowDays: 30,
  slotIntervalMinutes: 30,
  bufferMinutes: 15,
  cancellationNoticeHours: 2,
  joinedAt: "2026-03-01T10:00:00.000Z",
};

export const services: Service[] = [
  {
    id: "svc-1",
    profileId: profile.id,
    title: "Маникюр с покрытием",
    description: "Включает снятие старого покрытия и однотонный цвет, без дизайна.",
    durationMinutes: 120,
    price: 1900,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "svc-2",
    profileId: profile.id,
    title: "Коррекция бровей",
    description: "Форма, уход и легкая укладка без окрашивания.",
    durationMinutes: 45,
    price: 900,
    isActive: true,
    sortOrder: 2,
  },
];

export const clients: Client[] = [
  {
    id: "client-1",
    profileId: profile.id,
    name: "Дарья Шевцова",
    phoneMasked: "+7 978 ***-**-14",
    notes: "Любит утренние слоты, чувствительная кожа.",
    createdAt: "2026-03-02T08:30:00.000Z",
    lastBookingAt: "2026-04-03T08:30:00.000Z",
  },
  {
    id: "client-2",
    profileId: profile.id,
    name: "Марина Костенко",
    phoneMasked: "+7 978 ***-**-57",
    notes: "Просит заранее напоминать о визите.",
    createdAt: "2026-03-15T12:00:00.000Z",
    lastBookingAt: "2026-04-03T12:00:00.000Z",
  },
];

export const bookings: Booking[] = [
  {
    id: "booking-1",
    profileId: profile.id,
    clientId: "client-1",
    serviceId: "svc-1",
    status: "confirmed",
    startsAt: "2026-04-03T08:30:00.000Z",
    endsAt: "2026-04-03T10:30:00.000Z",
    source: "public_page",
    clientNote: "Если можно, приду на 10 минут позже.",
    cancellationToken: "cancel_1",
    cancellationTokenExpiresAt: "2026-04-03T06:30:00.000Z",
    createdAt: "2026-04-02T14:10:00.000Z",
    cancelledAt: null,
  },
  {
    id: "booking-2",
    profileId: profile.id,
    clientId: "client-2",
    serviceId: "svc-2",
    status: "confirmed",
    startsAt: "2026-04-03T12:00:00.000Z",
    endsAt: "2026-04-03T12:45:00.000Z",
    source: "public_page",
    clientNote: "У меня аллергия на один состав, расскажу на месте.",
    cancellationToken: "cancel_2",
    cancellationTokenExpiresAt: "2026-04-03T10:00:00.000Z",
    createdAt: "2026-04-02T15:15:00.000Z",
    cancelledAt: null,
  },
];

export const availabilityRules: AvailabilityRule[] = [
  { id: "av-1", profileId: profile.id, weekday: 1, startTime: "09:00", endTime: "18:00", isActive: true },
  { id: "av-2", profileId: profile.id, weekday: 2, startTime: "09:00", endTime: "18:00", isActive: true },
  { id: "av-3", profileId: profile.id, weekday: 3, startTime: "09:00", endTime: "18:00", isActive: true },
  { id: "av-4", profileId: profile.id, weekday: 4, startTime: "10:00", endTime: "19:00", isActive: true },
  { id: "av-5", profileId: profile.id, weekday: 5, startTime: "10:00", endTime: "16:00", isActive: true },
];

export const blockedSlots: BlockedSlot[] = [
  {
    id: "block-1",
    profileId: profile.id,
    startsAt: "2026-04-04T10:00:00.000Z",
    endsAt: "2026-04-04T11:00:00.000Z",
    reason: "Перерыв на закупку",
  },
];

export const notificationEvents: NotificationEvent[] = [
  {
    id: "notification-1",
    profileId: profile.id,
    type: "sms_confirmation",
    status: "sent",
    target: "+7 978 ***-**-14",
    createdAt: "2026-04-02T14:11:00.000Z",
  },
  {
    id: "notification-2",
    profileId: profile.id,
    type: "telegram_new_booking",
    status: "sent",
    target: "@okno_master_bot",
    createdAt: "2026-04-02T14:11:00.000Z",
  },
];

export const bookingSlots: BookingSlot[] = [
  { date: "4 апреля", value: "2026-04-04", times: ["09:00", "11:30", "13:00", "15:30"] },
  { date: "5 апреля", value: "2026-04-05", times: ["10:00", "12:00", "14:30", "17:00"] },
  { date: "6 апреля", value: "2026-04-06", times: ["09:30", "11:00", "13:30", "16:00"] },
];

export const pricingPlans = [
  {
    title: "Бесплатно",
    price: "0 ₽",
    description: "Для старта и первых клиентов без давления и скрытых ограничений.",
    features: [
      "До 50 записей в месяц",
      "Публичная страница мастера",
      "Онлайн-запись без регистрации",
      "SMS клиенту и Telegram мастеру",
    ],
  },
  {
    title: "okno Pro",
    price: "690 ₽",
    description: "Когда клиентов становится больше и нужно больше свободы.",
    features: [
      "Без лимита записей",
      "Приоритетные напоминания",
      "Глубже настройка брендинга",
      "Подготовка к автосообщениям и AI-функциям",
    ],
  },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

export const getServiceById = (serviceId: string) =>
  services.find((service) => service.id === serviceId);

export const getClientById = (clientId: string) =>
  clients.find((client) => client.id === clientId);
