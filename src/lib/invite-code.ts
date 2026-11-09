import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { safeEqualString } from "@/lib/tokens";

export type InviteCodeRow = {
  id: string;
  code: string;
  label: string;
  max_uses: number;
  uses: number;
  active: boolean;
  expires_at: string | null;
};

export type ValidatedInvite =
  | { kind: "db"; row: InviteCodeRow }
  | { kind: "global" };

/**
 * Validates an invite code for displaying the form / submitting RSVP.
 * Wrong/inactive/expired/used-up → null (caller should 404).
 */
export async function validateInviteCode(
  rawCode: string | null | undefined,
): Promise<ValidatedInvite | null> {
  const code = rawCode?.trim() ?? "";
  if (!code) return null;

  const envCode = process.env.INVITE_CODE?.trim() ?? "";

  try {
    const admin = createAdminClient();
    const { data: settings, error: settingsError } = await admin
      .from("settings")
      .select("global_code_enabled")
      .eq("id", 1)
      .maybeSingle();

    const globalEnabled =
      settingsError || !settings ? true : settings.global_code_enabled !== false;

    if (globalEnabled && envCode.length >= 10 && safeEqualString(code, envCode)) {
      return { kind: "global" };
    }

    const { data: rows, error } = await admin
      .from("invite_codes")
      .select("id, code, label, max_uses, uses, active, expires_at")
      .eq("code", code)
      .limit(1);

    if (error || !rows?.length) return null;

    const row = rows[0] as InviteCodeRow;
    if (!row.active) return null;
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return null;
    }
    if (row.uses >= row.max_uses) return null;

    if (!safeEqualString(code, row.code)) return null;

    return { kind: "db", row };
  } catch {
    if (envCode.length >= 10 && safeEqualString(code, envCode)) {
      return { kind: "global" };
    }
    return null;
  }
}

export function generateInviteCode(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}
