import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { manageLink } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateManageToken, hashToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("rsvps")
    .select(
      "id, first_name, last_name, response, age_group, note, status, was_confirmed, invite_code_id, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json(
      { ok: false, error: dbError.message || "Laden fehlgeschlagen" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, rsvps: data ?? [] });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    status?: "ausstehend" | "bestätigt" | "abgelehnt" | "zurückgezogen";
    regenerateToken?: boolean;
  } | null;

  if (!body?.id) {
    return NextResponse.json({ ok: false, error: "Ungültig" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.regenerateToken) {
    const token = generateManageToken();
    const manage_token_hash = hashToken(token);
    const { error: updError } = await admin
      .from("rsvps")
      .update({ manage_token_hash })
      .eq("id", body.id);
    if (updError) {
      return NextResponse.json({ ok: false, error: "Fehler" }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      manageToken: token,
      manageUrl: manageLink(token),
    });
  }

  if (body.status) {
    const patch: Record<string, unknown> = { status: body.status };
    if (body.status === "bestätigt") {
      patch.was_confirmed = true;
      patch.response = "komme";
    }
    if (body.status === "zurückgezogen") {
      patch.response = "komme_nicht";
    }
    const { error: updError } = await admin
      .from("rsvps")
      .update(patch)
      .eq("id", body.id);
    if (updError) {
      return NextResponse.json({ ok: false, error: "Fehler" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Ungültig" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    allConfirmed?: boolean;
  } | null;

  const admin = createAdminClient();

  if (body?.allConfirmed) {
    const { error: delError } = await admin
      .from("rsvps")
      .delete()
      .eq("response", "komme")
      .neq("status", "zurückgezogen");
    if (delError) {
      return NextResponse.json({ ok: false, error: "Fehler" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!body?.id) {
    return NextResponse.json({ ok: false, error: "Ungültig" }, { status: 400 });
  }

  const { error: delError } = await admin.from("rsvps").delete().eq("id", body.id);
  if (delError) {
    return NextResponse.json({ ok: false, error: "Fehler" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
