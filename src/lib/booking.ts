import { DateTime } from "luxon";

export function phoneLast4(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export function encryptPhone(phone: string) {
  return Buffer.from(phone, "utf8").toString("base64");
}

export function decryptPhone(phoneEncrypted: string) {
  return Buffer.from(phoneEncrypted, "base64").toString("utf8");
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

export function humanizeBookingDate(input: {
  startsAtIso: string;
  timezone: string;
}) {
  return DateTime.fromISO(input.startsAtIso, { zone: "utc" })
    .setZone(input.timezone)
    .setLocale("ru")
    .toFormat("d LLLL, HH:mm");
}
