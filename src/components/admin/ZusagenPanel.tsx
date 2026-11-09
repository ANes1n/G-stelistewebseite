"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Rsvp = {
  id: string;
  first_name: string;
  last_name: string;
  response: "komme" | "komme_nicht";
  over16: boolean;
  over18: boolean;
  note: string | null;
  status: "ausstehend" | "bestätigt" | "abgelehnt";
  created_at: string;
  updated_at: string;
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
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
    const zugesagt = rsvps.filter((r) => r.response === "komme").length;
    const abgesagt = rsvps.filter((r) => r.response === "komme_nicht").length;
    const ausstehend = rsvps.filter((r) => r.status === "ausstehend").length;
    return {
      zugesagt,
      abgesagt,
      ausstehend,
      gesamt: rsvps.length,
    };
  }, [rsvps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (statusFilter !== "alle" && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.first_name} ${r.last_name} ${r.note ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rsvps, query, statusFilter]);

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

  async function copyRegen() {
    if (!regenUrl) return;
    await navigator.clipboard.writeText(regenUrl);
    setFlash("Link kopiert.");
  }

  function exportConfirmed() {
    const rows = [
      ["Vorname", "Nachname", "16+", "18+"],
      ...rsvps
        .filter((r) => r.status === "bestätigt" && r.response === "komme")
        .map((r) => [
          r.first_name,
          r.last_name,
          r.over16 ? "ja" : "nein",
          r.over18 ? "ja" : "nein",
        ]),
    ];
    downloadCsv("zusagen-bestaetigt.csv", rows);
  }

  async function deleteAllYes() {
    if (
      !confirm(
        "Wirklich ALLE Zusagen (response = komme) löschen? Das kann nicht rückgängig gemacht werden.",
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
      setFlash("Alle Zusagen gelöscht.");
      await load();
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Zusagen</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {counters.zugesagt} zugesagt · {counters.abgesagt} abgesagt ·{" "}
            {counters.ausstehend} ausstehend · {counters.gesamt} gesamt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportConfirmed}
            className="touch-target glass rounded-xl px-3 text-sm"
          >
            CSV Export
          </button>
          <button
            type="button"
            onClick={deleteAllYes}
            className="touch-target rounded-xl bg-rose-500/20 px-3 text-sm text-rose-100"
          >
            Alle Zusagen löschen
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche…"
          className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base outline-none sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="touch-target rounded-xl border border-white/15 bg-white/5 px-3 text-base"
        >
          <option value="alle">Alle Status</option>
          <option value="ausstehend">Ausstehend</option>
          <option value="bestätigt">Bestätigt</option>
          <option value="abgelehnt">Abgelehnt</option>
        </select>
      </div>

      {flash ? (
        <div className="glass space-y-2 rounded-xl p-3 text-sm">
          <p>{flash}</p>
          {regenUrl ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="break-all text-xs text-[var(--text-muted)]">
                {regenUrl}
              </code>
              <button
                type="button"
                onClick={copyRegen}
                className="touch-target accent-gradient shrink-0 rounded-xl px-3 text-sm font-semibold text-[#0b0614]"
              >
                Kopieren
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Laden…</p>
      ) : (
        <>
          {/* Mobile cards */}
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

          {/* Desktop table */}
          <div className="glass hidden overflow-x-auto rounded-2xl md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Antwort</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Alter</th>
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
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {r.note}
                        </div>
                      ) : null}
                      {r.status === "bestätigt" &&
                      r.response === "komme_nicht" ? (
                        <span className="mt-2 inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100">
                          Absage nach Bestätigung
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {r.response === "komme" ? "Komme" : "Komme nicht"}
                    </td>
                    <td className="px-4 py-3 capitalize">{r.status}</td>
                    <td className="px-4 py-3">
                      {r.over16 ? "16+" : "–"} / {r.over18 ? "18+" : "–"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Action
                          label="Bestätigen"
                          onClick={() => setStatus(r.id, "bestätigt")}
                        />
                        <Action
                          label="Ablehnen"
                          onClick={() => setStatus(r.id, "abgelehnt")}
                        />
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
      className={`touch-target rounded-lg px-2 text-xs ${
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
    <article className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">
            {r.first_name} {r.last_name}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {r.response === "komme" ? "Komme" : "Komme nicht"} · {r.status}
          </p>
        </div>
        {r.status === "bestätigt" && r.response === "komme_nicht" ? (
          <span className="rounded-md bg-amber-500/20 px-2 py-1 text-xs text-amber-100">
            Absage nach Bestätigung
          </span>
        ) : null}
      </div>
      {r.note ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">{r.note}</p>
      ) : null}
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {r.over16 ? "16+" : "kein 16+"} · {r.over18 ? "18+" : "kein 18+"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Action label="Bestätigen" onClick={onConfirm} />
        <Action label="Ablehnen" onClick={onReject} />
        <Action label="Link neu" onClick={onRegen} />
        <Action label="Löschen" danger onClick={onDelete} />
      </div>
    </article>
  );
}
