"use client";

import { motion } from "framer-motion";
import { party } from "@/config/party";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function PartyDetails() {
  const rows = [
    { label: "Datum", value: party.dateLabel },
    { label: "Uhrzeit", value: party.timeLabel },
    {
      label: "Ort",
      value: [party.place.name, party.place.address, party.place.notes]
        .filter(Boolean)
        .join("\n"),
    },
    { label: "Dresscode", value: party.dressCode },
    { label: "Alter", value: party.ageInfo },
    { label: "RSVP", value: party.rsvpDeadlineLabel },
    {
      label: "Kontakt",
      value: [party.contact.name, party.contact.phone, party.contact.email]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  return (
    <div className="space-y-4">
      <motion.div
        custom={0}
        variants={fade}
        initial="hidden"
        animate="show"
        className="text-center"
      >
        <p className="float-glow font-display accent-text text-sm font-semibold tracking-[0.2em] uppercase">
          {party.brandName}
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          {party.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--text-muted)]">
          {party.subtitle}
        </p>
      </motion.div>

      <motion.div
        custom={1}
        variants={fade}
        initial="hidden"
        animate="show"
        className="glass rounded-2xl p-5"
      >
        <dl className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
                {row.label}
              </dt>
              <dd className="mt-1 whitespace-pre-line text-[15px] leading-snug">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </div>
  );
}
