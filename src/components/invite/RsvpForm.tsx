"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SuccessScreen } from "./SuccessScreen";
import { AGE_GROUP_LABELS, type AgeGroup } from "@/lib/format-event";

type Props = {
  code: string;
  formClosed: boolean;
  formClosedReason?: "closed" | "deadline" | "full";
  turnstileSiteKey?: string;
  privacyNote: string;
};

type ApiOk = {
  ok: true;
  firstName: string;
  manageToken: string;
  manageUrl: string;
};

const AGE_OPTIONS: AgeGroup[] = ["u16", "16_17", "18_plus"];

export function RsvpForm({
  code,
  formClosed,
  formClosedReason,
  turnstileSiteKey,
  privacyNote,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ApiOk | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [note, setNote] = useState("");

  if (success) {
    return (
      <SuccessScreen
        firstName={success.firstName}
        manageUrl={success.manageUrl}
        manageToken={success.manageToken}
      />
    );
  }

  if (formClosed) {
    const message =
      formClosedReason === "full"
        ? "Leider sind alle Plätze vergeben."
        : formClosedReason === "deadline"
          ? "Die Anmeldefrist ist abgelaufen."
          : "Anmeldungen sind derzeit geschlossen.";
    return (
      <div className="glass rounded-2xl p-5 text-center">
        <h2 className="heading-2 font-semibold">Anmeldung geschlossen</h2>
        <p className="mt-2 text-[16px] text-[var(--text-muted)]">{message}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!ageGroup) {
      setError("Bitte wähle deine Altersgruppe.");
      return;
    }

    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    let turnstileToken: string | undefined;
    if (turnstileSiteKey) {
      const input = form.querySelector<HTMLInputElement>(
        '[name="cf-turnstile-response"]',
      );
      turnstileToken = input?.value || undefined;
    }

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code,
          firstName: String(fd.get("firstName") ?? ""),
          lastName: String(fd.get("lastName") ?? ""),
          ageGroup,
          note: String(fd.get("note") ?? ""),
          website: String(fd.get("website") ?? ""),
          turnstileToken,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as
        | ApiOk
        | { ok?: false; error?: string };

      if (!res.ok || !("ok" in data) || !data.ok) {
        setError(
          (data as { error?: string }).error ||
            "Das hat nicht geklappt. Bitte versuche es erneut.",
        );
        return;
      }

      setSuccess(data);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      onSubmit={onSubmit}
      className="glass w-full max-w-full space-y-4 rounded-2xl p-4 sm:p-5"
      noValidate
    >
      <h2 className="heading-2 font-semibold">Jetzt anmelden</h2>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      >
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label mb-1.5 block">Vorname</span>
          <input
            name="firstName"
            required
            maxLength={80}
            autoComplete="given-name"
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[16px] outline-none focus:border-violet-300/60"
          />
        </label>
        <label className="block">
          <span className="field-label mb-1.5 block">Nachname</span>
          <input
            name="lastName"
            required
            maxLength={80}
            autoComplete="family-name"
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[16px] outline-none focus:border-violet-300/60"
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="field-label mb-1.5">Altersgruppe</legend>
        {AGE_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            className="age-card"
            data-selected={ageGroup === opt}
            onClick={() => setAgeGroup(opt)}
          >
            <span
              className={`inline-flex size-5 shrink-0 rounded-full border-2 ${
                ageGroup === opt
                  ? "border-violet-300 bg-violet-400"
                  : "border-white/35"
              }`}
            />
            <span className="text-[16px] font-medium">{AGE_GROUP_LABELS[opt]}</span>
          </button>
        ))}
      </fieldset>

      <label className="block">
        <span className="field-label mb-1.5 block">Anmerkung (optional)</span>
        <textarea
          name="note"
          maxLength={200}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-[16px] outline-none focus:border-violet-300/60"
        />
        <span className="mt-1 block text-right text-[13px] text-[var(--text-muted)]">
          {note.length}/200
        </span>
      </label>

      {turnstileSiteKey ? (
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-theme="dark"
        />
      ) : null}

      <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
        {privacyNote}
      </p>

      {error ? (
        <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-[15px] text-rose-200">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Sende…" : "Anmeldung absenden"}
      </button>

      <p className="text-center text-[14px] leading-relaxed text-[var(--text-muted)]">
        Alle Anmeldungen werden von uns manuell geprüft. Du bekommst eine
        Bestätigung von uns.
      </p>
    </motion.form>
  );
}
