"use client";

import { useState } from "react";

type Props = {
  token: string;
  firstName: string;
  lastName: string;
  over16: boolean;
  over18: boolean;
  initialResponse: "komme" | "komme_nicht";
  initialNote: string;
  canSwitchToYes: boolean;
  blockedReason?: "closed" | "deadline" | "full";
};

export function ManageForm({
  token,
  firstName,
  lastName,
  over16,
  over18,
  initialResponse,
  initialNote,
  canSwitchToYes,
  blockedReason,
}: Props) {
  const [response, setResponse] = useState(initialResponse);
  const [note, setNote] = useState(initialNote);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yesBlocked =
    response !== "komme" && !canSwitchToYes && blockedReason;

  async function submit(next: "komme" | "komme_nicht") {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/rsvp/manage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, response: next, note }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Aktualisierung fehlgeschlagen.");
        return;
      }
      setResponse(next);
      setMessage("Deine Antwort wurde gespeichert.");
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass space-y-5 rounded-2xl p-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Deine RSVP</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Nur dein eigener Eintrag — ohne Gästeliste.
        </p>
      </div>

      <div className="space-y-2 text-[15px]">
        <p>
          <span className="text-[var(--text-muted)]">Name:</span> {firstName}{" "}
          {lastName}
        </p>
        <p>
          <span className="text-[var(--text-muted)]">Mindestens 16:</span>{" "}
          {over16 ? "Ja" : "Nein"}
        </p>
        <p>
          <span className="text-[var(--text-muted)]">Mindestens 18:</span>{" "}
          {over18 ? "Ja" : "Nein"}
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-[var(--text-muted)]">
          Anmerkung (optional)
        </span>
        <textarea
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

      {yesBlocked ? (
        <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
          {blockedReason === "full"
            ? "Zusagen sind derzeit nicht möglich (voll)."
            : blockedReason === "deadline"
              ? "Die Anmeldefrist ist abgelaufen — Absagen sind weiter möglich."
              : "Zusagen sind geschlossen — Absagen sind weiter möglich."}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={pending || (response !== "komme" && !canSwitchToYes)}
          onClick={() => submit("komme")}
          className="touch-target accent-gradient rounded-xl text-sm font-semibold text-[#0b0614] disabled:opacity-50"
        >
          Ich komme
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("komme_nicht")}
          className="touch-target glass rounded-xl text-sm font-medium disabled:opacity-50"
        >
          Ich kann doch nicht kommen
        </button>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)]">
        Aktuell: {response === "komme" ? "Ich komme" : "Ich komme nicht"}
      </p>
    </div>
  );
}
