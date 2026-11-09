"use client";

import { motion } from "framer-motion";
import type { EventInfo } from "@/lib/event-info-shared";
import {
  effectiveTimeLabel,
  formatDateRangeLabel,
  isVisibleText,
  placeAddressLine,
} from "@/lib/format-event";

type Props = {
  event: EventInfo;
  compact?: boolean;
};

export function InvitationCard({ event, compact = false }: Props) {
  const dateLabel = formatDateRangeLabel(event);
  const timeLabel = effectiveTimeLabel(event);
  const address = placeAddressLine(event);

  const rows: { label: string; value: string }[] = [];
  if (isVisibleText(dateLabel)) rows.push({ label: "Datum", value: dateLabel });
  if (isVisibleText(timeLabel)) rows.push({ label: "Uhrzeit", value: timeLabel });

  const placeParts = [
    isVisibleText(event.place_name) ? event.place_name : "",
    isVisibleText(address) ? address : "",
    isVisibleText(event.place_notes) ? event.place_notes : "",
  ].filter(Boolean);
  if (placeParts.length) {
    rows.push({ label: "Ort", value: placeParts.join("\n") });
  }

  if (isVisibleText(event.dress_code)) {
    rows.push({ label: "Dresscode", value: event.dress_code });
  }
  if (isVisibleText(event.age_info)) {
    rows.push({ label: "Alter", value: event.age_info });
  }
  if (isVisibleText(event.rsvp_hint)) {
    rows.push({ label: "RSVP", value: event.rsvp_hint });
  }

  const contactParts = [
    event.contact_name,
    event.contact_phone,
    event.contact_email,
  ].filter(isVisibleText);
  if (contactParts.length) {
    rows.push({ label: "Kontakt", value: contactParts.join("\n") });
  }
  if (isVisibleText(event.extra_info)) {
    rows.push({ label: "Infos", value: event.extra_info });
  }

  return (
    <div className="w-full max-w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        {isVisibleText(event.party_name) ? (
          <p className="float-glow font-display accent-text text-[13px] font-semibold tracking-[0.18em] uppercase">
            {event.party_name}
          </p>
        ) : null}
        <h1 className="heading-1 mt-3 font-bold">Einladung</h1>
        {isVisibleText(event.tagline) ? (
          <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-[var(--text-muted)]">
            {event.tagline}
          </p>
        ) : null}
      </motion.div>

      {!compact && rows.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="glass rounded-2xl p-4 sm:p-5"
          id="einladung-details"
        >
          <dl className="space-y-4">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="field-label tracking-wide uppercase">
                  {row.label}
                </dt>
                <dd className="mt-1 whitespace-pre-line text-[16px] leading-snug">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      ) : null}
    </div>
  );
}
