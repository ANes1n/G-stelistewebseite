import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SettingsRow = {
  id: number;
  rsvp_open: boolean;
  rsvp_deadline: string | null;
  max_rsvps: number;
  global_code_enabled: boolean;
};

export const DEFAULT_SETTINGS: SettingsRow = {
  id: 1,
  rsvp_open: true,
  rsvp_deadline: null,
  max_rsvps: 150,
  global_code_enabled: true,
};

const SELECT =
  "id, rsvp_open, rsvp_deadline, max_rsvps, global_code_enabled" as const;

/**
 * Ensures the single settings row exists (upsert) and returns it.
 * Used by admin API so Einstellungen never hangs on a missing row.
 */
export async function ensureSettingsRow(): Promise<{
  settings: SettingsRow;
  error: string | null;
}> {
  try {
    const admin = createAdminClient();
    const { data: existing, error: readError } = await admin
      .from("settings")
      .select(SELECT)
      .eq("id", 1)
      .maybeSingle();

    if (!readError && existing) {
      return { settings: existing as SettingsRow, error: null };
    }

    const { data: upserted, error: upsertError } = await admin
      .from("settings")
      .upsert(
        {
          id: 1,
          rsvp_open: DEFAULT_SETTINGS.rsvp_open,
          rsvp_deadline: DEFAULT_SETTINGS.rsvp_deadline,
          max_rsvps: DEFAULT_SETTINGS.max_rsvps,
          global_code_enabled: DEFAULT_SETTINGS.global_code_enabled,
        },
        { onConflict: "id" },
      )
      .select(SELECT)
      .maybeSingle();

    if (upsertError || !upserted) {
      return {
        settings: DEFAULT_SETTINGS,
        error:
          upsertError?.message ||
          readError?.message ||
          "Einstellungen nicht erreichbar",
      };
    }

    return { settings: upserted as SettingsRow, error: null };
  } catch (e) {
    return {
      settings: DEFAULT_SETTINGS,
      error: e instanceof Error ? e.message : "Einstellungen nicht erreichbar",
    };
  }
}
