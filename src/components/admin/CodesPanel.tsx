"use client";

import { useCallback, useEffect, useState } from "react";

type Code = {
  id: string;
  code: string;
  label: string;
  max_uses: number;
  uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  link: string;
  overused?: boolean;
};

export function CodesPanel() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/codes");
      const data = await res.json();
      if (data.ok) setCodes(data.codes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCodes(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label, maxUses, count }),
      });
      if (res.ok) {
        setLabel("");
        setCount(1);
        setMaxUses(1);
        await load();
      }
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/admin/codes", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Code löschen?")) return;
    await fetch("/api/admin/codes", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function copyLink(code: Code) {
    await navigator.clipboard.writeText(code.link);
    setCopiedId(code.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function exportCsv() {
    const rows = [
      ["label", "code", "link", "uses", "max_uses", "active"],
      ...codes.map((c) => [
        c.label,
        c.code,
        c.link,
        String(c.uses),
        String(c.max_uses),
        c.active ? "1" : "0",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "einladungscodes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Einladungscodes
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Links: /einladung?code=…
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="touch-target glass rounded-xl px-3 text-sm"
        >
          CSV Export
        </button>
      </header>

      <form
        onSubmit={createCodes}
        className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-4"
      >
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm text-[var(--text-muted)]">
            Label
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base"
            placeholder="z. B. Freundeskreis"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-[var(--text-muted)]">
            Max. Uses
          </span>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(Number(e.target.value))}
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-[var(--text-muted)]">
            Anzahl
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="touch-target accent-gradient rounded-xl text-sm font-semibold text-[#0b0614] sm:col-span-4"
        >
          {pending ? "…" : count > 1 ? `${count} Codes erstellen` : "Code erstellen"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Laden…</p>
      ) : (
        <div className="space-y-3">
          {codes.map((c) => (
            <article key={c.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.label || "Ohne Label"}</p>
                  <p className="mt-1 font-mono text-sm tracking-wide">{c.code}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {c.uses}/{c.max_uses} Uses ·{" "}
                    {c.active ? "aktiv" : "deaktiviert"}
                  </p>
                  {c.uses > c.max_uses ? (
                    <p className="mt-2 text-xs text-amber-200">
                      Warnung: häufiger genutzt als erwartet
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(c)}
                    className="touch-target accent-gradient rounded-xl px-3 text-xs font-semibold text-[#0b0614]"
                  >
                    {copiedId === c.id ? "Kopiert" : "Link kopieren"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(c.id, !c.active)}
                    className="touch-target rounded-xl bg-white/10 px-3 text-xs"
                  >
                    {c.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="touch-target rounded-xl bg-rose-500/20 px-3 text-xs text-rose-100"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
