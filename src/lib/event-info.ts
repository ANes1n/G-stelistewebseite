import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_EVENT_INFO,
  type EventInfo,
} from "@/lib/event-info-shared";

export type { EventInfo };
export { DEFAULT_EVENT_INFO };

const SELECT = `
  id, party_name, tagline, starts_at, ends_at, time_label, time_label_override,
  place_name, place_street, place_city, place_notes, dress_code, age_info,
  rsvp_hint, contact_name, contact_phone, contact_email, extra_info,
  calendar_summary, calendar_description
`;

export async function getEventInfo(): Promise<EventInfo> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("event_info")
      .select(SELECT)
      .eq("id", 1)
      .maybeSingle();
    if (data) return data as EventInfo;
  } catch {
    // fall through
  }
  return DEFAULT_EVENT_INFO;
}

export async function ensureEventInfo(): Promise<EventInfo> {
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("event_info")
      .select(SELECT)
      .eq("id", 1)
      .maybeSingle();
    if (existing) return existing as EventInfo;

    const { id: _id, ...seed } = DEFAULT_EVENT_INFO;
    void _id;
    const { data: upserted } = await admin
      .from("event_info")
      .upsert({ id: 1, ...seed }, { onConflict: "id" })
      .select(SELECT)
      .maybeSingle();
    if (upserted) return upserted as EventInfo;
  } catch {
    // fall through
  }
  return DEFAULT_EVENT_INFO;
}
