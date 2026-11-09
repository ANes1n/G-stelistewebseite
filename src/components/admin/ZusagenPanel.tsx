"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AGE_GROUP_LABELS,
  type AgeGroup,
} from "@/lib/format-event";

type Rsvp = {
  id: string;
  first_name: string;
  last_name: string;
  response: "komme" | "komme_nicht";
  age_group: AgeGroup;
  note: string | null;
  status: "ausstehend" | "bestätigt" | "abgelehnt" | "zurückgezogen";
  was_confirmed: boolean;
  created_at: string;
  updated_at: string;
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ZusagenPanel() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [ageFilter, setAgeFilter] = useState<string>("alle");
  const [flash, setFlash] = useState<string | null>(null);
  const [regenUrl, setRegenUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rsvps");
      const data = await res.json();
      if (data.ok) setRsvps(data.rsvps);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counters = useMemo(() => {
    const active = rsvps.filter(
      (r) => r.response === "komme" && r.status !== "zurückgezogen",
    );
    return {
      aktiv: active.length,
      ausstehend: rsvps.filter((r) => r.status === "ausstehend").length,
      bestätigt: rsvps.filter((r) => r.status === "bestätigt").length,
      abgelehnt: rsvps.filter((r) => r.status === "abgelehnt").length,
      zurückgezogen: rsvps.filter((r) => r.status === "zurückgezogen").length,
      u16: rsvps.filter((r) => r.age_group === "u16").length,
      a1617: rsvps.filter((r) => r.age_group === "16_17").length,
      a18: rsvps.filter((r) => r.age_group === "18_plus").length,
      gesamt: rsvps.length,
    };
  }, [rsvps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (statusFilter !== "alle" && r.status !== statusFilter) return false;
      if (ageFilter !== "alle" && r.age_group !== ageFilter) return false;
      if (!q) return true;
      return `${r.first_name} ${r.last_name} ${r.note ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rsvps, query, statusFilter, ageFilter]);

  async function setStatus(id: string, status: Rsvp["status"]) {
    const res = await fetch("/api/admin/rsvps", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string) {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    const res = await fetch("/api/admin/rsvps", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await load();
  }

  async function regenerate(id: string) {
    const res = await fetch("/api/admin/rsvps", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, regenerateToken: true }),
    });
    const data = await res.json();
    if (data.ok && data.manageUrl) {
      setRegenUrl(data.manageUrl);
      setFlash("Neuer Manage-Link erzeugt (alter Link ungültig).");
    }
  }

  function exportConfirmed() {
    const rows = [
      ["Vorname", "Nachname", "Altersgruppe"],
      ...rsvps
        .filter((r) => r.status === "bestätigt" && r.response === "komme")
        .map((r) => [
          r.first_name,
          r.last_name,
          AGE_GROUP_LABELS[r.age_group] ?? r.age_group,
        ]),
    ];
    downloadCsv("zusagen-bestaetigt.csv", rows);
  }

  async function deleteAllYes() {
    if (
      !confirm(
        "Wirklich ALLE aktiven Zusagen löschen? Das kann nicht rückgängig gemacht werden.",
      )
    ) {
      return;
    }
    const res = await fetch("/api/admin/rsvps", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ allConfirmed: true }),
    });
    if (res.ok) {
      setFlash("Aktive Zusagen gelöscht.");
      await load();
    }
  }

  return (
    <div className="admin-page space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-full">
          <h1 className="font-display font-semibold">Zusagen</h1>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]">
            {counters.aktiv} aktiv · {counters.ausstehend} ausstehend ·{" "}
            {counters.bestätigt} bestätigt · {counters.zurückgezogen} zurück ·{" "}
            {counters.gesamt} gesamt
          </p>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]">
            Alter: {counters.u16} u16 · {counters.a1617} 16–17 · {counters.a18}{" "}
            18+
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button type="button" onClick={exportConfirmed} className="btn btn-secondary sm:w-auto">
            CSV Export
          </button>
          <button type="button" onClick={deleteAllYes} className="btn btn-danger sm:w-auto">
            Alle Zusagen löschen
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche…"
          className="admin-input sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input sm:max-w-[12rem]"
        >
          <option value="alle">Alle Status</option>
          <option value="ausstehend">Ausstehend</option>
          <option value="bestätigt">Bestätigt</option>
          <option value="abgelehnt">Abgelehnt</option>
          <option value="zurückgezogen">Zurückgezogen</option>
        </select>
        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="admin-input sm:max-w-[12rem]"
        >
          <option value="alle">Alle Alter</option>
          <option value="u16">Unter 16</option>
          <option value="16_17">16–17</option>
          <option value="18_plus">18+</option>
        </select>
      </div>

      {flash ? (
        <div className="glass space-y-2 rounded-xl p-3 text-[15px]">
          <p>{flash}</p>
          {regenUrl ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="break-all text-[13px] text-[var(--text-muted)]">
                {regenUrl}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(regenUrl)}
                className="btn btn-primary sm:w-auto"
              >
                Kopieren
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-[15px] text-[var(--text-muted)]">Laden…</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <RsvpCard
                key={r.id}
                rsvp={r}
                onConfirm={() => setStatus(r.id, "bestätigt")}
                onReject={() => setStatus(r.id, "abgelehnt")}
                onDelete={() => remove(r.id)}
                onRegen={() => regenerate(r.id)}
              />
            ))}
          </div>

          <div className="glass hidden overflow-x-auto rounded-2xl md:block">
            <table className="w-full min-w-[760px] text-left text-[15px]">
              <thead className="border-b border-white/10 text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Alter</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.first_name} {r.last_name}
                      </div>
                      {r.note ? (
                        <div className="mt-1 text-[13px] text-[var(--text-muted)]">
                          {r.note}
                        </div>
                      ) : null}
                      {r.status === "zurückgezogen" && r.was_confirmed ? (
                        <span className="badge badge-warn mt-2">
                          Absage nach Bestätigung
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-age">
                        {AGE_GROUP_LABELS[r.age_group]}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{r.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Action label="Bestätigen" onClick={() => setStatus(r.id, "bestätigt")} />
                        <Action label="Ablehnen" onClick={() => setStatus(r.id, "abgelehnt")} />
                        <Action label="Link neu" onClick={() => regenerate(r.id)} />
                        <Action label="Löschen" danger onClick={() => remove(r.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Action({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-target rounded-lg px-2 text-[13px] ${
        danger ? "bg-rose-500/20 text-rose-100" : "bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function RsvpCard({
  rsvp: r,
  onConfirm,
  onReject,
  onDelete,
  onRegen,
}: {
  rsvp: Rsvp;
  onConfirm: () => void;
  onReject: () => void;
  onDelete: () => void;
  onRegen: () => void;
}) {
  return (
    <article className="glass admin-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-medium">
            {r.first_name} {r.last_name}
          </h2>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]">{r.status}</p>
        </div>
        <span className="badge badge-age shrink-0">
          {AGE_GROUP_LABELS[r.age_group]}
        </span>
      </div>
      {r.status === "zurückgezogen" && r.was_confirmed ? (
        <span className="badge badge-warn mt-2">Absage nach Bestätigung</span>
      ) : null}
      {r.note ? (
        <p className="mt-2 text-[14px] text-[var(--text-muted)]">{r.note}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Action label="Bestätigen" onClick={onConfirm} />
        <Action label="Ablehnen" onClick={onReject} />
        <Action label="Link neu" onClick={onRegen} />
        <Action label="Löschen" danger onClick={onDelete} />
      </div>
    </article>
  );
}
