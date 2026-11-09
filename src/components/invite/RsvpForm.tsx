"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { party } from "@/config/party";
import { SuccessScreen } from "./SuccessScreen";

type Props = {
  code: string;
  formClosed: boolean;
  formClosedReason?: "closed" | "deadline" | "full";
  turnstileSiteKey?: string;
};

type ApiOk = {
  ok: true;
  firstName: string;
  manageToken: string;
  manageUrl: string;
};

export function RsvpForm({
  code,
  formClosed,
  formClosedReason,
  turnstileSiteKey,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ApiOk | null>(null);
  const [response, setResponse] = useState<"komme" | "komme_nicht" | "">("");
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
          : "Rückmeldungen sind derzeit geschlossen.";
    return (
      <div className="glass rounded-2xl p-5 text-center">
        <p className="font-display text-xl font-semibold">RSVP geschlossen</p>
        <p className="mt-2 text-[15px] text-[var(--text-muted)]">{message}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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
          response: String(fd.get("response") ?? ""),
          over16: fd.get("over16") === "on",
          over18: fd.get("over18") === "on",
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
      transition={{ delay: 0.2, duration: 0.45 }}
      onSubmit={onSubmit}
      className="glass space-y-4 rounded-2xl p-5"
      noValidate
    >
      <h2 className="font-display text-xl font-semibold">Rückmeldung</h2>

      {/* Honeypot */}
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
          <span className="mb-1.5 block text-sm text-[var(--text-muted)]">
            Vorname
          </span>
          <input
            name="firstName"
            required
            maxLength={80}
            autoComplete="given-name"
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base outline-none focus:border-violet-300/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--text-muted)]">
            Nachname
          </span>
          <input
            name="lastName"
            required
            maxLength={80}
            autoComplete="family-name"
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base outline-none focus:border-violet-300/60"
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm text-[var(--text-muted)]">
          Antwort
        </legend>
        <label className="touch-target glass flex cursor-pointer items-center gap-3 rounded-xl px-3">
          <input
            type="radio"
            name="response"
            value="komme"
            required
            checked={response === "komme"}
            onChange={() => setResponse("komme")}
            className="size-5 accent-pink-400"
          />
          <span>Ich komme</span>
        </label>
        <label className="touch-target glass flex cursor-pointer items-center gap-3 rounded-xl px-3">
          <input
            type="radio"
            name="response"
            value="komme_nicht"
            checked={response === "komme_nicht"}
            onChange={() => setResponse("komme_nicht")}
            className="size-5 accent-pink-400"
          />
          <span>Ich komme nicht</span>
        </label>
      </fieldset>

      <label className="touch-target flex items-start gap-3">
        <input
          type="checkbox"
          name="over16"
          className="mt-1 size-5 shrink-0 accent-violet-400"
        />
        <span className="text-[15px]">Ich bin mindestens 16</span>
      </label>
      <label className="touch-target flex items-start gap-3">
        <input
          type="checkbox"
          name="over18"
          className="mt-1 size-5 shrink-0 accent-violet-400"
        />
        <span className="text-[15px]">Ich bin mindestens 18</span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm text-[var(--text-muted)]">
          Anmerkung (optional)
        </span>
        <textarea
          name="note"
          maxLength={200}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-base outline-none focus:border-violet-300/60"
        />
        <span className="mt-1 block text-right text-xs text-[var(--text-muted)]">
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

      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
        {party.privacyNote}
      </p>

      {error ? (
        <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="touch-target accent-gradient w-full rounded-xl text-sm font-semibold text-[#0b0614] disabled:opacity-60"
      >
        {pending ? "Sende…" : "Absenden"}
      </button>
    </motion.form>
  );
}
