"use client";

import { useState } from "react";
import {
  AGE_GROUP_LABELS,
  STATUS_GUEST_LABELS,
  type AgeGroup,
} from "@/lib/format-event";

type Status = "ausstehend" | "bestätigt" | "abgelehnt" | "zurückgezogen";

type Props = {
  token: string;
  firstName: string;
  lastName: string;
  ageGroup: AgeGroup;
  initialNote: string;
  initialStatus: Status;
  wasBestätigt: boolean;
  canReregister: boolean;
  blockedReason?: "closed" | "deadline" | "full";
};

export function ManageForm({
  token,
  firstName,
  lastName,
  ageGroup,
  initialNote,
  initialStatus,
  wasBestätigt,
  canReregister,
  blockedReason,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const withdrawn = status === "zurückgezogen";

  async function run(action: "withdraw" | "reregister" | "note") {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/rsvp/manage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, action, note }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        status?: Status;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Aktualisierung fehlgeschlagen.");
        return;
      }
      if (data.status) setStatus(data.status);
      if (action === "withdraw") {
        setMessage("Deine Anmeldung wurde zurückgezogen.");
        setConfirmWithdraw(false);
      } else if (action === "reregister") {
        setMessage("Du bist wieder angemeldet — Status: Wird geprüft.");
      } else {
        setMessage("Anmerkung gespeichert.");
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass w-full max-w-full space-y-5 rounded-2xl p-4 sm:p-5">
      <div>
        <h1 className="heading-2 font-semibold">Deine Anmeldung</h1>
        <p className="mt-1 text-[15px] text-[var(--text-muted)]">
          Nur dein eigener Eintrag — ohne Gästeliste.
        </p>
      </div>

      <div className="space-y-2 text-[16px]">
        <p>
          <span className="text-[var(--text-muted)]">Name:</span> {firstName}{" "}
          {lastName}
        </p>
        <p>
          <span className="text-[var(--text-muted)]">Altersgruppe:</span>{" "}
          <span className="badge badge-age">{AGE_GROUP_LABELS[ageGroup]}</span>
        </p>
        <p>
          <span className="text-[var(--text-muted)]">Status:</span>{" "}
          {STATUS_GUEST_LABELS[status] ?? status}
        </p>
        {withdrawn && wasBestätigt ? (
          <p className="badge badge-warn">Absage nach Bestätigung</p>
        ) : null}
      </div>

      <label className="block">
        <span className="field-label mb-1.5 block">Anmerkung (optional)</span>
        <textarea
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

      {error ? (
        <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-[15px] text-rose-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-[15px] text-emerald-100">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={pending}
          className="btn btn-secondary"
          onClick={() => run("note")}
        >
          Anmerkung speichern
        </button>

        {!withdrawn ? (
          <button
            type="button"
            disabled={pending}
            className="btn btn-danger"
            onClick={() => setConfirmWithdraw(true)}
          >
            Anmeldung zurückziehen
          </button>
        ) : (
          <>
            {!canReregister && blockedReason ? (
              <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-[15px] text-amber-100">
                {blockedReason === "full"
                  ? "Wiederanmelden ist derzeit nicht möglich (voll)."
                  : blockedReason === "deadline"
                    ? "Die Anmeldefrist ist abgelaufen."
                    : "Anmeldungen sind geschlossen."}
              </p>
            ) : null}
            <button
              type="button"
              disabled={pending || !canReregister}
              className="btn btn-primary"
              onClick={() => run("reregister")}
            >
              Wieder anmelden
            </button>
          </>
        )}
      </div>

      {confirmWithdraw ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass w-full max-w-md space-y-4 rounded-2xl p-5">
            <h2 className="heading-2 font-semibold">Anmeldung zurückziehen?</h2>
            <p className="text-[15px] text-[var(--text-muted)]">
              Du kannst dich später über diesen Link wieder anmelden, solange
              die Anmeldung offen ist.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => run("withdraw")}
            >
              Ja, zurückziehen
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmWithdraw(false)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
