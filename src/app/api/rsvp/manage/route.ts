import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  canAcceptYes,
  countYesRsvps,
  getSettings,
} from "@/lib/rsvp-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashEquals, hashToken } from "@/lib/tokens";
import { manageRsvpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Aktualisierung fehlgeschlagen.";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`rsvp-manage:${ip}`, 10, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Anfragen. Bitte warte kurz." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = manageRsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Bitte prüfe deine Angaben." },
        { status: 400 },
      );
    }

    const { token, response, note } = parsed.data;
    const tokenHash = hashToken(token);
    const admin = createAdminClient();

    const { data: row } = await admin
      .from("rsvps")
      .select("id, response, manage_token_hash")
      .eq("manage_token_hash", tokenHash)
      .maybeSingle();

    if (!row || !hashEquals(token, row.manage_token_hash)) {
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 404 });
    }

    // Cancelling always allowed; switching to "komme" may be blocked.
    if (response === "komme" && row.response !== "komme") {
      const settings = await getSettings();
      if (!settings) {
        return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 500 });
      }
      const yesCount = await countYesRsvps();
      const capacity = canAcceptYes(settings, yesCount);
      if (!capacity.ok) {
        const error =
          capacity.reason === "full"
            ? "Leider sind alle Plätze vergeben."
            : capacity.reason === "deadline"
              ? "Die Anmeldefrist ist abgelaufen."
              : "Zusagen sind geschlossen.";
        return NextResponse.json({ ok: false, error }, { status: 400 });
      }
    }

    const { error } = await admin
      .from("rsvps")
      .update({
        response,
        note: note && note.length > 0 ? note : null,
      })
      .eq("id", row.id)
      .eq("manage_token_hash", tokenHash);

    if (error) {
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
