import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  isAdminUiPreview,
  previewCreateCodes,
  previewDeleteCode,
  previewListCodes,
  previewToggleCode,
} from "@/lib/admin-preview-store";
import { generateInviteCode } from "@/lib/invite-code";
import { inviteLink } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  if (isAdminUiPreview()) {
    return NextResponse.json({ ok: true, codes: previewListCodes() });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("invite_codes")
    .select("id, code, label, max_uses, uses, active, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json(
      { ok: false, error: dbError.message || "Codes konnten nicht geladen werden" },
      { status: 500 },
    );
  }

  const codes = (data ?? []).map((row) => ({
    ...row,
    link: inviteLink(row.code),
    overused: row.uses > row.max_uses,
  }));

  return NextResponse.json({ ok: true, codes });
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    label?: string;
    maxUses?: number;
    count?: number;
    expiresAt?: string | null;
  } | null;

  const count = Math.min(Math.max(Number(body?.count ?? 1), 1), 100);
  const maxUses = Math.min(Math.max(Number(body?.maxUses ?? 1), 1), 1000);
  const label = (body?.label ?? "").trim().slice(0, 120);
  const expiresAt = body?.expiresAt || null;

  if (isAdminUiPreview()) {
    const created = previewCreateCodes({
      label,
      maxUses,
      count,
      expiresAt,
    });
    return NextResponse.json({ ok: true, codes: created });
  }

  const admin = createAdminClient();
  const rows = Array.from({ length: count }, () => ({
    code: generateInviteCode(12),
    label,
    max_uses: maxUses,
    expires_at: expiresAt,
    active: true,
  }));

  const { data, error: dbError } = await admin
    .from("invite_codes")
    .insert(rows)
    .select("id, code, label, max_uses, uses, active, expires_at, created_at");

  if (dbError) {
    return NextResponse.json(
      { ok: false, error: dbError.message || "Codes konnten nicht erstellt werden" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    codes: (data ?? []).map((row) => ({ ...row, link: inviteLink(row.code) })),
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    active?: boolean;
  } | null;

  if (!body?.id || typeof body.active !== "boolean") {
    return NextResponse.json({ ok: false, error: "Ungültig" }, { status: 400 });
  }

  if (isAdminUiPreview()) {
    if (!previewToggleCode(body.id, body.active)) {
      return NextResponse.json({ ok: false, error: "Code nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("invite_codes")
    .update({ active: body.active })
    .eq("id", body.id);

  if (dbError) {
    return NextResponse.json(
      { ok: false, error: dbError.message || "Status konnte nicht geändert werden" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage" }, { status: 400 });
  }

  if (isAdminUiPreview()) {
    if (!previewDeleteCode(body.id)) {
      return NextResponse.json({ ok: false, error: "Code nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("invite_codes")
    .delete()
    .eq("id", body.id);

  if (dbError) {
    return NextResponse.json(
      { ok: false, error: dbError.message || "Code konnte nicht gelöscht werden" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
