"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { InvitationCard } from "@/components/invite/InvitationCard";
import { Toast, type ToastState } from "@/components/admin/Toast";
import {
  DEFAULT_EVENT_INFO,
  type EventInfo,
} from "@/lib/event-info-shared";
import { autoTimeLabel } from "@/lib/format-event";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local in local browser TZ — admin should set Europe/Berlin times
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventPanel() {
  const [event, setEvent] = useState<EventInfo>(DEFAULT_EVENT_INFO);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastSeq = useState(() => ({ n: 0 }))[0];

  const pushToast = useCallback(
    (kind: NonNullable<ToastState>["kind"], message: string) => {
      toastSeq.n += 1;
      setToast({ kind, message, id: toastSeq.n });
    },
    [toastSeq],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/event");
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.event) setEvent(data.event);
      else pushToast("error", data.error || "Einladung konnte nicht geladen werden");
    } catch {
      pushToast("error", "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const previewEvent = useMemo(() => {
    if (event.time_label_override) return event;
    return {
      ...event,
      time_label: autoTimeLabel(event),
    };
  }, [event]);

  function setField<K extends keyof EventInfo>(key: K, value: EventInfo[K]) {
    setEvent((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/event", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        pushToast("error", data.error || "Speichern fehlgeschlagen");
        return;
      }
      setEvent(data.event);
      pushToast("success", "Gespeichert");
    } catch {
      pushToast("error", "Netzwerkfehler beim Speichern");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page flex min-h-[40vh] items-center justify-center gap-3 text-[var(--text-muted)]">
        <Loader2 className="size-7 animate-spin" />
        <span>Laden…</span>
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <header>
        <h1 className="font-display font-semibold">Einladung</h1>
        <p className="mt-1 text-[15px] text-[var(--text-muted)]">
          Eine aktive Einladungskarte für die ganze Website (Zeitzone:
          Europe/Berlin beim Speichern beachten).
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="space-y-4">
          <Field label="Party-Name">
            <input
              className="admin-input"
              value={event.party_name}
              onChange={(e) => setField("party_name", e.target.value)}
              required
            />
          </Field>
          <Field label="Tagline">
            <input
              className="admin-input"
              value={event.tagline}
              onChange={(e) => setField("tagline", e.target.value)}
            />
          </Field>
          <Field label="Start">
            <input
              type="datetime-local"
              className="admin-input"
              value={toLocalInput(event.starts_at)}
              onChange={(e) =>
                setField(
                  "starts_at",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : event.starts_at,
                )
              }
              required
            />
          </Field>
          <Field label="Ende">
            <input
              type="datetime-local"
              className="admin-input"
              value={toLocalInput(event.ends_at)}
              onChange={(e) =>
                setField(
                  "ends_at",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : event.ends_at,
                )
              }
              required
            />
          </Field>
          <label className="glass admin-card touch-target flex items-center justify-between gap-3">
            <span className="text-[16px]">Uhrzeit-Text manuell</span>
            <input
              type="checkbox"
              checked={event.time_label_override}
              onChange={(e) => setField("time_label_override", e.target.checked)}
              className="size-5 accent-violet-400"
            />
          </label>
          <Field label="Uhrzeit-Text">
            <input
              className="admin-input"
              value={
                event.time_label_override
                  ? event.time_label
                  : autoTimeLabel(event)
              }
              disabled={!event.time_label_override}
              onChange={(e) => setField("time_label", e.target.value)}
            />
          </Field>
          <Field label="Ort Name">
            <input
              className="admin-input"
              value={event.place_name}
              onChange={(e) => setField("place_name", e.target.value)}
            />
          </Field>
          <Field label="Straße">
            <input
              className="admin-input"
              value={event.place_street}
              onChange={(e) => setField("place_street", e.target.value)}
            />
          </Field>
          <Field label="PLZ / Ort">
            <input
              className="admin-input"
              value={event.place_city}
              onChange={(e) => setField("place_city", e.target.value)}
            />
          </Field>
          <Field label="Anfahrt / Klingel">
            <textarea
              className="admin-input min-h-[88px]"
              value={event.place_notes}
              onChange={(e) => setField("place_notes", e.target.value)}
            />
          </Field>
          <Field label="Dresscode">
            <input
              className="admin-input"
              value={event.dress_code}
              onChange={(e) => setField("dress_code", e.target.value)}
            />
          </Field>
          <Field label="Altershinweis">
            <input
              className="admin-input"
              value={event.age_info}
              onChange={(e) => setField("age_info", e.target.value)}
            />
          </Field>
          <Field label="RSVP-Hinweis">
            <input
              className="admin-input"
              value={event.rsvp_hint}
              onChange={(e) => setField("rsvp_hint", e.target.value)}
            />
          </Field>
          <Field label="Kontakt Name">
            <input
              className="admin-input"
              value={event.contact_name}
              onChange={(e) => setField("contact_name", e.target.value)}
            />
          </Field>
          <Field label="Telefon">
            <input
              className="admin-input"
              value={event.contact_phone}
              onChange={(e) => setField("contact_phone", e.target.value)}
            />
          </Field>
          <Field label="E-Mail">
            <input
              className="admin-input"
              value={event.contact_email}
              onChange={(e) => setField("contact_email", e.target.value)}
            />
          </Field>
          <Field label="Extra-Infos">
            <textarea
              className="admin-input min-h-[100px]"
              value={event.extra_info}
              onChange={(e) => setField("extra_info", e.target.value)}
            />
          </Field>
          <Field label="Kalender-Titel">
            <input
              className="admin-input"
              value={event.calendar_summary}
              onChange={(e) => setField("calendar_summary", e.target.value)}
            />
          </Field>
          <Field label="Kalender-Beschreibung">
            <textarea
              className="admin-input min-h-[88px]"
              value={event.calendar_description}
              onChange={(e) => setField("calendar_description", e.target.value)}
            />
          </Field>

          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Save className="size-5" />
            )}
            Speichern
          </button>
        </form>

        <div className="space-y-3">
          <p className="field-label">Live-Vorschau</p>
          <div className="glass rounded-2xl p-4">
            <InvitationCard event={previewEvent} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="glass admin-card block">
      <span className="admin-label mb-2 block">{label}</span>
      {children}
    </label>
  );
}
