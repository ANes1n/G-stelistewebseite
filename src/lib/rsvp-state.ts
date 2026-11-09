import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SettingsRow = {
  id: number;
  rsvp_open: boolean;
  rsvp_deadline: string | null;
  max_rsvps: number;
  global_code_enabled: boolean;
};

export async function getSettings(): Promise<SettingsRow | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("settings")
      .select(
        "id, rsvp_open, rsvp_deadline, max_rsvps, global_code_enabled",
      )
      .eq("id", 1)
      .maybeSingle();
    return (data as SettingsRow | null) ?? null;
  } catch {
    return null;
  }
}

/** Defaults used only when the DB is unreachable (local UI smoke). */
export function defaultSettings(): SettingsRow {
  return {
    id: 1,
    rsvp_open: true,
    rsvp_deadline: null,
    max_rsvps: 150,
    global_code_enabled: true,
  };
}

export async function countYesRsvps(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("response", "komme")
      .neq("status", "zurückgezogen");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export function isPastDeadline(settings: SettingsRow): boolean {
  if (!settings.rsvp_deadline) return false;
  return new Date(settings.rsvp_deadline).getTime() < Date.now();
}

export function canAcceptYes(
  settings: SettingsRow,
  yesCount: number,
): { ok: boolean; reason?: "closed" | "deadline" | "full" } {
  if (!settings.rsvp_open) return { ok: false, reason: "closed" };
  if (isPastDeadline(settings)) return { ok: false, reason: "deadline" };
  if (yesCount >= settings.max_rsvps) return { ok: false, reason: "full" };
  return { ok: true };
}
