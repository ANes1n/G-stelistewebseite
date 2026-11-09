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
      "id, first_name, last_name, response, over16, over18, note, status, invite_code_id, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ ok: false, error: "Laden fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rsvps: data ?? [] });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    status?: "ausstehend" | "bestätigt" | "abgelehnt";
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
    const { error: updError } = await admin
      .from("rsvps")
      .update({ status: body.status })
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
      .eq("response", "komme");
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
