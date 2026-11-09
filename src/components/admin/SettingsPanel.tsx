"use client";

import { useEffect, useState } from "react";

type Settings = {
  rsvp_open: boolean;
  rsvp_deadline: string | null;
  max_rsvps: number;
  global_code_enabled: boolean;
};

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.ok) setSettings(data.settings);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setPending(true);
    setMessage(null);
    try {
      const deadline = settings.rsvp_deadline
        ? new Date(settings.rsvp_deadline).toISOString()
        : null;
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...settings,
          rsvp_deadline: deadline,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSettings(data.settings);
        setMessage("Gespeichert.");
      } else {
        setMessage("Speichern fehlgeschlagen.");
      }
    } finally {
      setPending(false);
    }
  }

  if (!settings) {
    return <p className="text-sm text-[var(--text-muted)]">Laden…</p>;
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Einstellungen</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          RSVP-Steuerung für die Einladung
        </p>
      </header>

      <label className="glass touch-target flex items-center justify-between gap-3 rounded-2xl px-4">
        <span>RSVP geöffnet</span>
        <input
          type="checkbox"
          checked={settings.rsvp_open}
          onChange={(e) =>
            setSettings({ ...settings, rsvp_open: e.target.checked })
          }
          className="size-5 accent-violet-400"
        />
      </label>

      <label className="glass block rounded-2xl p-4">
        <span className="mb-2 block text-sm text-[var(--text-muted)]">
          RSVP-Deadline
        </span>
        <input
          type="datetime-local"
          value={toLocalInput(settings.rsvp_deadline)}
          onChange={(e) =>
            setSettings({
              ...settings,
              rsvp_deadline: e.target.value
                ? new Date(e.target.value).toISOString()
                : null,
            })
          }
          className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base"
        />
      </label>

      <label className="glass block rounded-2xl p-4">
        <span className="mb-2 block text-sm text-[var(--text-muted)]">
          Max. Zusagen
        </span>
        <input
          type="number"
          min={1}
          value={settings.max_rsvps}
          onChange={(e) =>
            setSettings({
              ...settings,
              max_rsvps: Number(e.target.value),
            })
          }
          className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base"
        />
      </label>

      <label className="glass touch-target flex items-center justify-between gap-3 rounded-2xl px-4">
        <span>Globaler Code (INVITE_CODE) aktiv</span>
        <input
          type="checkbox"
          checked={settings.global_code_enabled}
          onChange={(e) =>
            setSettings({
              ...settings,
              global_code_enabled: e.target.checked,
            })
          }
          className="size-5 accent-violet-400"
        />
      </label>

      {message ? (
        <p className="text-sm text-emerald-200">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="touch-target accent-gradient w-full rounded-xl text-sm font-semibold text-[#0b0614] disabled:opacity-60"
      >
        {pending ? "…" : "Speichern"}
      </button>
    </form>
  );
}
