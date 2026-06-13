import crypto from "crypto";

export function cleanText(value: FormDataEntryValue | null, maxLength = 3000) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function cleanMultiline(value: FormDataEntryValue | null, maxLength = 5000) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

export function hashIp(ip: string) {
  const salt = process.env.IP_HASH_SALT || "buy0050-default-salt-change-me";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function isValidEmail(email: string) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatDateTimeForEmail(date = new Date()) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
