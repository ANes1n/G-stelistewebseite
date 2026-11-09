import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  isAdminUiPreview,
} from "@/lib/admin-preview-store";
import { ensureEventInfo } from "@/lib/event-info";
import {
  DEFAULT_EVENT_INFO,
  type EventInfo,
} from "@/lib/event-info-shared";
import { autoTimeLabel } from "@/lib/format-event";
import { createAdminClient } from "@/lib/supabase/admin";
import { eventInfoSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

let previewEvent: EventInfo = { ...DEFAULT_EVENT_INFO };

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  if (isAdminUiPreview()) {
    return NextResponse.json({ ok: true, event: previewEvent });
  }

  const event = await ensureEventInfo();
  return NextResponse.json({ ok: true, event });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = eventInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Bitte prüfe die Eingaben." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const starts = new Date(data.starts_at);
  const ends = new Date(data.ends_at);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return NextResponse.json(
      { ok: false, error: "Ungültiges Datum." },
      { status: 400 },
    );
  }
  if (ends.getTime() <= starts.getTime()) {
    return NextResponse.json(
      { ok: false, error: "Ende muss nach dem Start liegen." },
      { status: 400 },
    );
  }

  const timeLabel = data.time_label_override
    ? data.time_label
    : autoTimeLabel({
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
      });

  const payload = {
    id: 1,
    ...data,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    time_label: timeLabel,
    calendar_summary: data.calendar_summary || data.party_name,
  };

  if (isAdminUiPreview()) {
    previewEvent = { ...previewEvent, ...payload };
    return NextResponse.json({ ok: true, event: previewEvent });
  }

  try {
    const admin = createAdminClient();
    await ensureEventInfo();
    const { data: saved, error: dbError } = await admin
      .from("event_info")
      .upsert(payload, { onConflict: "id" })
      .select(
        `id, party_name, tagline, starts_at, ends_at, time_label, time_label_override,
         place_name, place_street, place_city, place_notes, dress_code, age_info,
         rsvp_hint, contact_name, contact_phone, contact_email, extra_info,
         calendar_summary, calendar_description`,
      )
      .maybeSingle();

    if (dbError || !saved) {
      return NextResponse.json(
        { ok: false, error: dbError?.message || "Speichern fehlgeschlagen" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, event: saved });
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
