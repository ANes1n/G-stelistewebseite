import { NextResponse } from "next/server";
import { party } from "@/config/party";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashEquals, hashToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  if (token.length < 20) {
    return new NextResponse("Not found", { status: 404 });
  }

  const tokenHash = hashToken(token);
  const admin = createAdminClient();
  const { data } = await admin
    .from("rsvps")
    .select("first_name, manage_token_hash")
    .eq("manage_token_hash", tokenHash)
    .maybeSingle();

  if (!data || !hashEquals(token, data.manage_token_hash)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const uid = `${tokenHash.slice(0, 16)}@invite`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Birthday Invite//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    `DTSTART:${party.calendar.start}`,
    `DTEND:${party.calendar.end}`,
    `SUMMARY:${icsEscape(party.calendar.summary)}`,
    `DESCRIPTION:${icsEscape(party.calendar.description)}`,
    `LOCATION:${icsEscape(party.calendar.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="einladung.ics"`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
