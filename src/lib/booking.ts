import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { DateTime } from "luxon";
import { env } from "@/lib/env";

const PHONE_ENCRYPTION_VERSION = "enc1";

function getPhoneSecret() {
  const secret = env.phoneEncryptionSecret ?? env.supabaseServiceRoleKey;

  if (!secret) {
    throw new Error(
      "Нужен PHONE_ENCRYPTION_SECRET или SUPABASE_SERVICE_ROLE_KEY для защиты телефонов.",
    );
  }

  return secret;
}

function getPhoneKey() {
  return createHash("sha256").update(getPhoneSecret()).digest();
}

export function phoneLast4(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export function encryptPhone(phone: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getPhoneKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(phone, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    PHONE_ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptPhone(phoneEncrypted: string) {
  if (!phoneEncrypted) {
    return "";
  }

  if (!phoneEncrypted.startsWith(`${PHONE_ENCRYPTION_VERSION}:`)) {
    return Buffer.from(phoneEncrypted, "base64").toString("utf8");
  }

  const [, ivBase64Url, authTagBase64Url, encryptedBase64Url] =
    phoneEncrypted.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getPhoneKey(),
    Buffer.from(ivBase64Url, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(authTagBase64Url, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64Url, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function hashPhone(phone: string) {
  return createHash("sha256")
    .update(`${getPhoneSecret()}:${phone}`)
    .digest("hex");
}

export function toUtcIsoFromLocalSlot(input: {
  date: string;
  time: string;
  timezone: string;
}) {
  return DateTime.fromISO(`${input.date}T${input.time}`, {
    zone: input.timezone,
  }).toUTC().toISO();
}

export function getCancellationDeadlineIso(input: {
  startsAtIso: string;
  cancellationNoticeHours: number;
}) {
  return DateTime.fromISO(input.startsAtIso, { zone: "utc" })
    .minus({ hours: Math.max(0, input.cancellationNoticeHours) })
    .toISO();
}

export function humanizeBookingDate(input: {
  startsAtIso: string;
  timezone: string;
}) {
  return DateTime.fromISO(input.startsAtIso, { zone: "utc" })
    .setZone(input.timezone)
    .setLocale("ru")
    .toFormat("d LLLL, HH:mm");
}
