"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Save } from "lucide-react";
import { Toast, type ToastState } from "@/components/admin/Toast";

type Settings = {
  rsvp_open: boolean;
  rsvp_deadline: string | null;
  max_rsvps: number;
  global_code_enabled: boolean;
};

const DEFAULTS: Settings = {
  rsvp_open: true,
  rsvp_deadline: null,
  max_rsvps: 150,
  global_code_enabled: true,
};

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastSeq = useState(() => ({ n: 0 }))[0];

  function pushToast(kind: NonNullable<ToastState>["kind"], message: string) {
    toastSeq.n += 1;
    setToast({ kind, message, id: toastSeq.n });
  }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSettings(DEFAULTS);
        setLoadError(
          data.error ||
            "Einstellungen konnten nicht geladen werden. Standardwerte werden angezeigt.",
        );
        return;
      }

      if (data.settings) {
        setSettings({
          rsvp_open: Boolean(data.settings.rsvp_open),
          rsvp_deadline: data.settings.rsvp_deadline ?? null,
          max_rsvps: Number(data.settings.max_rsvps) || 150,
          global_code_enabled: data.settings.global_code_enabled !== false,
        });
      } else {
        setSettings(DEFAULTS);
      }

      if (data.warning) {
        setLoadError(data.warning);
      }
    } catch {
      setSettings(DEFAULTS);
      setLoadError(
        "Netzwerkfehler. Standardwerte werden angezeigt — Speichern kann später funktionieren.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        pushToast("error", data.error || "Speichern fehlgeschlagen");
        return;
      }
      if (data.settings) {
        setSettings({
          rsvp_open: Boolean(data.settings.rsvp_open),
          rsvp_deadline: data.settings.rsvp_deadline ?? null,
          max_rsvps: Number(data.settings.max_rsvps) || 150,
          global_code_enabled: data.settings.global_code_enabled !== false,
        });
      }
      setLoadError(null);
      pushToast("success", "Gespeichert");
    } catch {
      pushToast("error", "Netzwerkfehler beim Speichern");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-[17px]">Einstellungen werden geladen…</p>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="admin-page mx-auto max-w-lg space-y-5">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header>
        <h1 className="font-display font-semibold">Einstellungen</h1>
        <p className="mt-1 text-[16px] text-[var(--text-muted)]">
          Anmeldung und Kapazität steuern
        </p>
      </header>

      {loadError ? (
        <div
          role="alert"
          className="glass admin-card space-y-3 border border-amber-400/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
            <p className="text-[16px] text-amber-50">{loadError}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            <RefreshCw className="size-5" aria-hidden />
            Erneut versuchen
          </button>
        </div>
      ) : null}

      <label className="glass admin-card touch-target-lg flex items-center justify-between gap-4">
        <span className="text-[17px]">Anmeldung offen</span>
        <input
          type="checkbox"
          checked={settings.rsvp_open}
          onChange={(e) =>
            setSettings({ ...settings, rsvp_open: e.target.checked })
          }
          className="size-6 accent-violet-400"
        />
      </label>

      <label className="glass admin-card block">
        <span className="admin-label mb-2 block">Anmeldeschluss</span>
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
          className="admin-input"
        />
      </label>

      <label className="glass admin-card block">
        <span className="admin-label mb-2 block">Max. Anmeldungen</span>
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
          className="admin-input"
        />
      </label>

      <label className="glass admin-card touch-target-lg flex items-center justify-between gap-4">
        <span className="text-[17px]">Globaler Code an/aus</span>
        <input
          type="checkbox"
          checked={settings.global_code_enabled}
          onChange={(e) =>
            setSettings({
              ...settings,
              global_code_enabled: e.target.checked,
            })
          }
          className="size-6 accent-violet-400"
        />
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Save className="size-5" aria-hidden />
        )}
        {pending ? "Speichere…" : "Speichern"}
      </button>
    </form>
  );
}
