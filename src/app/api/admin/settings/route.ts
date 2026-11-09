import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("settings")
    .select("id, rsvp_open, rsvp_deadline, max_rsvps, global_code_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (dbError || !data) {
    return NextResponse.json({ ok: false, error: "Laden fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings: data });
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
    return NextResponse.json({ ok: false, error: "Ungültig" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.rsvp_open === "boolean") patch.rsvp_open = body.rsvp_open;
  if ("rsvp_deadline" in body) {
    patch.rsvp_deadline = body.rsvp_deadline || null;
  }
  if (typeof body.max_rsvps === "number") {
    patch.max_rsvps = Math.min(Math.max(Math.floor(body.max_rsvps), 1), 10000);
  }
  if (typeof body.global_code_enabled === "boolean") {
    patch.global_code_enabled = body.global_code_enabled;
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("settings")
    .update(patch)
    .eq("id", 1)
    .select("id, rsvp_open, rsvp_deadline, max_rsvps, global_code_enabled")
    .maybeSingle();

  if (dbError || !data) {
    return NextResponse.json({ ok: false, error: "Speichern fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings: data });
}
