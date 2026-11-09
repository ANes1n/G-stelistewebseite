import { NextResponse } from "next/server";
import { validateInviteCode } from "@/lib/invite-code";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { manageLink } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateManageToken, hashToken } from "@/lib/tokens";
import { verifyTurnstile } from "@/lib/turnstile";
import { rsvpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Das hat nicht geklappt. Bitte versuche es erneut.";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`rsvp:${ip}`, 5, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Anfragen. Bitte warte kurz." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);

    if (
      body &&
      typeof body === "object" &&
      "website" in body &&
      typeof (body as { website?: unknown }).website === "string" &&
      (body as { website: string }).website.length > 0
    ) {
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
    }

    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Bitte prüfe deine Angaben." },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const turnstileOk = await verifyTurnstile(data.turnstileToken, ip);
    if (!turnstileOk) {
      return NextResponse.json(
        { ok: false, error: "Sicherheitsprüfung fehlgeschlagen." },
        { status: 400 },
      );
    }

    const invite = await validateInviteCode(data.code);
    if (!invite) {
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 404 });
    }

    const manageToken = generateManageToken();
    const manageTokenHash = hashToken(manageToken);

    const admin = createAdminClient();
    const { error } = await admin.rpc("create_rsvp_atomic", {
      p_invite_code_id: invite.kind === "db" ? invite.row.id : null,
      p_first_name: data.firstName,
      p_last_name: data.lastName,
      p_age_group: data.ageGroup,
      p_note: data.note ?? "",
      p_manage_token_hash: manageTokenHash,
      p_increment_code: invite.kind === "db",
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("rsvp_closed")) {
        return NextResponse.json(
          { ok: false, error: "Anmeldungen sind geschlossen." },
          { status: 400 },
        );
      }
      if (msg.includes("rsvp_deadline")) {
        return NextResponse.json(
          { ok: false, error: "Die Anmeldefrist ist abgelaufen." },
          { status: 400 },
        );
      }
      if (msg.includes("rsvp_full")) {
        return NextResponse.json(
          { ok: false, error: "Leider sind alle Plätze vergeben." },
          { status: 400 },
        );
      }
      if (
        msg.includes("invalid_code") ||
        msg.includes("code_expired") ||
        msg.includes("code_used_up")
      ) {
        return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      firstName: data.firstName,
      manageToken,
      manageUrl: manageLink(manageToken),
    });
  } catch {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
