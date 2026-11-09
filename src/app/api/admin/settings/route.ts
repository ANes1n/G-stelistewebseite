import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  isAdminUiPreview,
  previewGetSettings,
  previewUpdateSettings,
} from "@/lib/admin-preview-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SETTINGS, ensureSettingsRow } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  if (isAdminUiPreview()) {
    return NextResponse.json({
      ok: true,
      settings: previewGetSettings(),
      warning: null,
    });
  }

  const { settings, error: settingsError } = await ensureSettingsRow();

  return NextResponse.json({
    ok: true,
    settings,
    warning: settingsError
      ? "Datenbankzeile fehlt oder ist nicht erreichbar — Standardwerte werden angezeigt."
      : null,
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    rsvp_open?: boolean;
    rsvp_deadline?: string | null;
    max_rsvps?: number;
    global_code_enabled?: boolean;
  } | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage" }, { status: 400 });
  }

  const patch: Partial<{
    rsvp_open: boolean;
    rsvp_deadline: string | null;
    max_rsvps: number;
    global_code_enabled: boolean;
  }> = {};
  if (typeof body.rsvp_open === "boolean") patch.rsvp_open = body.rsvp_open;
  if ("rsvp_deadline" in body) {
    patch.rsvp_deadline = body.rsvp_deadline || null;
  }
  if (typeof body.max_rsvps === "number" && Number.isFinite(body.max_rsvps)) {
    patch.max_rsvps = Math.min(Math.max(Math.floor(body.max_rsvps), 1), 10000);
  }
  if (typeof body.global_code_enabled === "boolean") {
    patch.global_code_enabled = body.global_code_enabled;
  }

  if (isAdminUiPreview()) {
    return NextResponse.json({
      ok: true,
      settings: previewUpdateSettings(patch),
    });
  }

  await ensureSettingsRow();

  try {
    const admin = createAdminClient();
    const { data, error: dbError } = await admin
      .from("settings")
      .upsert({ id: 1, ...patch }, { onConflict: "id" })
      .select("id, rsvp_open, rsvp_deadline, max_rsvps, global_code_enabled")
      .maybeSingle();

    if (dbError || !data) {
      return NextResponse.json(
        {
          ok: false,
          error: dbError?.message || "Speichern fehlgeschlagen",
          settings: DEFAULT_SETTINGS,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, settings: data });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
      },
      { status: 500 },
    );
  }
}
