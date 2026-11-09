import type { EventInfo } from "@/lib/event-info-shared";

const BERLIN = "Europe/Berlin";

export type AgeGroup = "u16" | "16_17" | "18_plus";

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  u16: "Unter 16",
  "16_17": "16–17",
  "18_plus": "18 oder älter",
};

export const STATUS_GUEST_LABELS: Record<string, string> = {
  ausstehend: "Wird geprüft",
  bestätigt: "Bestätigt",
  abgelehnt: "Leider nicht möglich",
  zurückgezogen: "Zurückgezogen",
};

export function formatBerlinDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: BERLIN,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatBerlinTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: BERLIN,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatDateRangeLabel(event: EventInfo): string {
  const start = formatBerlinDate(event.starts_at);
  const end = formatBerlinDate(event.ends_at);
  if (!start) return "";
  if (!end || start === end) return start;
  return `${start} bis ${end}`;
}

export function autoTimeLabel(event: Pick<EventInfo, "starts_at" | "ends_at">): string {
  const startT = formatBerlinTime(event.starts_at);
  const endT = formatBerlinTime(event.ends_at);
  const startD = formatBerlinDate(event.starts_at);
  const endD = formatBerlinDate(event.ends_at);
  if (!startT) return "";
  if (startD && endD && startD !== endD) {
    return `ab ${startT} Uhr bis ${endD}, ${endT} Uhr`;
  }
  return endT ? `ab ${startT} Uhr bis ${endT} Uhr` : `ab ${startT} Uhr`;
}

export function effectiveTimeLabel(event: EventInfo): string {
  if (event.time_label_override && event.time_label.trim()) {
    return event.time_label.trim();
  }
  return autoTimeLabel(event) || event.time_label.trim();
}

/** Local datetime wall clock in Europe/Berlin → ICS floating local (no Z). */
export function toIcsLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BERLIN,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value.padStart(2, "0") ?? "00";

  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

export function placeAddressLine(event: EventInfo): string {
  return [event.place_street, event.place_city].filter(Boolean).join(", ");
}

export function calendarLocation(event: EventInfo): string {
  return [event.place_name, placeAddressLine(event)].filter(Boolean).join(", ");
}

/** Hide empty / leftover TODO placeholders */
export function isVisibleText(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (!v) return false;
  if (/^\[?\s*TODO/i.test(v)) return false;
  return true;
}
