"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Link2,
  Share2,
  Power,
  Trash2,
  Download,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Toast,
  copyToClipboard,
  type ToastState,
} from "@/components/admin/Toast";

export type Code = {
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

function formatCreated(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CodesPanel() {
  const router = useRouter();
  const [codes, setCodes] = useState<Code[]>([]);
  const [label, setLabel] = useState("");
  const [maxUsesInput, setMaxUsesInput] = useState("1");
  const [countInput, setCountInput] = useState("1");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastId = useState(() => ({ n: 0 }))[0];
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [lastCreatedIds, setLastCreatedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Code | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const showToast = useCallback((kind: NonNullable<ToastState>["kind"], message: string) => {
    toastId.n += 1;
    setToast({ kind, message, id: toastId.n });
  }, [toastId]);

  const parsedCount = Math.min(100, Math.max(1, parseInt(countInput, 10) || 1));
  const parsedMaxUses = Math.min(1000, Math.max(1, parseInt(maxUsesInput, 10) || 1));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/codes");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        showToast("error", data.error || "Codes konnten nicht geladen werden");
        return;
      }
      setCodes(data.codes as Code[]);
    } catch {
      showToast("error", "Netzwerkfehler beim Laden der Codes");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  function highlightIds(ids: string[]) {
    setHighlighted(new Set(ids));
    setLastCreatedIds(ids);
    window.setTimeout(() => setHighlighted(new Set()), 3500);
  }

  async function createCodes(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label,
          maxUses: parsedMaxUses,
          count: parsedCount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        showToast("error", data.error || "Erstellen fehlgeschlagen");
        return;
      }

      const created = (data.codes as Code[]) ?? [];
      // Optimistic: prepend new codes immediately (no full-page reload).
      setCodes((prev) => {
        const ids = new Set(created.map((c) => c.id));
        return [...created, ...prev.filter((c) => !ids.has(c.id))];
      });
      highlightIds(created.map((c) => c.id));
      setLabel("");
      setCountInput("1");
      setMaxUsesInput("1");
      showToast(
        "success",
        created.length > 1
          ? `${created.length} Codes erstellt`
          : "Code erstellt",
      );
      router.refresh();
    } catch {
      showToast("error", "Netzwerkfehler beim Erstellen");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(code: Code) {
    const next = !code.active;
    setBusyId(code.id);
    setCodes((prev) =>
      prev.map((c) => (c.id === code.id ? { ...c, active: next } : c)),
    );
    try {
      const res = await fetch("/api/admin/codes", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: code.id, active: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setCodes((prev) =>
          prev.map((c) =>
            c.id === code.id ? { ...c, active: code.active } : c,
          ),
        );
        showToast("error", data.error || "Status konnte nicht geändert werden");
        return;
      }
      showToast("success", next ? "Code aktiviert" : "Code deaktiviert");
      router.refresh();
    } catch {
      setCodes((prev) =>
        prev.map((c) =>
          c.id === code.id ? { ...c, active: code.active } : c,
        ),
      );
      showToast("error", "Netzwerkfehler");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRemove() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    setBusyId(target.id);
    const snapshot = codes;
    setCodes((prev) => prev.filter((c) => c.id !== target.id));
    try {
      const res = await fetch("/api/admin/codes", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: target.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setCodes(snapshot);
        showToast("error", data.error || "Löschen fehlgeschlagen");
        return;
      }
      showToast("success", "Code gelöscht");
      router.refresh();
    } catch {
      setCodes(snapshot);
      showToast("error", "Netzwerkfehler beim Löschen");
    } finally {
      setBusyId(null);
    }
  }

  async function copyText(text: string, okMessage: string) {
    const ok = await copyToClipboard(text);
    if (ok) showToast("success", okMessage);
    else showToast("error", "Kopieren nicht möglich");
  }

  async function shareLink(code: Code) {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: code.label || "Einladung",
          text: "Deine Einladung",
          url: code.link,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copyText(code.link, "Link kopiert (Teilen nicht verfügbar)");
  }

  async function copyAllLinks() {
    const ids = lastCreatedIds.length
      ? lastCreatedIds
      : codes.slice(0, parsedCount).map((c) => c.id);
    const links = codes
      .filter((c) => ids.includes(c.id))
      .map((c) => c.link);
    if (!links.length) {
      showToast("info", "Keine neuen Links zum Kopieren");
      return;
    }
    await copyText(links.join("\n"), "Alle Links kopiert!");
  }

  function exportCsv() {
    const rows = [
      ["label", "code", "link", "uses", "max_uses", "active", "created_at"],
      ...codes.map((c) => [
        c.label,
        c.code,
        c.link,
        String(c.uses),
        String(c.max_uses),
        c.active ? "1" : "0",
        c.created_at,
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
    <div className="admin-page space-y-5">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display font-semibold">Einladungscodes</h1>
          <p className="mt-1 text-[16px] text-[var(--text-muted)]">
            Alle Codes aus der Datenbank · Link: /einladung?code=…
          </p>
        </div>
        <button type="button" onClick={exportCsv} className="btn btn-secondary sm:w-auto">
          <Download className="size-5" aria-hidden />
          CSV Export
        </button>
      </header>

      <form onSubmit={createCodes} className="glass admin-card grid gap-4 sm:grid-cols-4">
        <label className="block sm:col-span-2">
          <span className="admin-label mb-2 block">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="admin-input"
            placeholder="z. B. Freundeskreis"
          />
        </label>
        <label className="block">
          <span className="admin-label mb-2 block">Max. Uses</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={maxUsesInput}
            onChange={(e) => setMaxUsesInput(e.target.value)}
            className="admin-input"
          />
        </label>
        <label className="block">
          <span className="admin-label mb-2 block">Anzahl</span>
          <input
            type="number"
            min={1}
            max={100}
            inputMode="numeric"
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            className="admin-input"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary sm:col-span-4"
        >
          {pending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-5" aria-hidden />
          )}
          {pending
            ? "Erstelle…"
            : parsedCount > 1
              ? `${parsedCount} Codes erstellen`
              : "Code erstellen"}
        </button>
      </form>

      {lastCreatedIds.length > 1 ? (
        <button type="button" onClick={copyAllLinks} className="btn btn-secondary">
          <Copy className="size-5" aria-hidden />
          Alle Links kopieren
        </button>
      ) : null}

      {loading ? (
        <p className="text-[16px] text-[var(--text-muted)]">Laden…</p>
      ) : codes.length === 0 ? (
        <p className="glass admin-card text-[16px] text-[var(--text-muted)]">
          Noch keine Codes. Erstelle den ersten oben.
        </p>
      ) : (
        <div className="space-y-4">
          {codes.map((c) => (
            <article
              key={c.id}
              className={`glass admin-card space-y-4 ${
                highlighted.has(c.id) ? "admin-card-highlight" : ""
              }`}
            >
              <div>
                <p className="text-[18px] font-semibold">
                  {c.label || "Ohne Label"}
                </p>
                <p className="mt-2 font-mono text-[18px] tracking-wide break-all">
                  {c.code}
                </p>
                <p className="mt-2 break-all text-[15px] text-[var(--text-muted)]">
                  {c.link}
                </p>
                <p className="mt-2 text-[15px] text-[var(--text-muted)]">
                  {c.uses}/{c.max_uses} Uses ·{" "}
                  {c.active ? "aktiv" : "deaktiviert"} · erstellt{" "}
                  {formatCreated(c.created_at)}
                </p>
                {c.uses > c.max_uses ? (
                  <p className="mt-2 text-[15px] text-amber-200">
                    Warnung: häufiger genutzt als erwartet
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => copyText(c.link, "Kopiert!")}
                >
                  <Link2 className="size-5" aria-hidden />
                  Link kopieren
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => copyText(c.code, "Code kopiert!")}
                >
                  <Copy className="size-5" aria-hidden />
                  Code kopieren
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => shareLink(c)}
                >
                  <Share2 className="size-5" aria-hidden />
                  Teilen
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busyId === c.id}
                  onClick={() => toggleActive(c)}
                >
                  <Power className="size-5" aria-hidden />
                  {c.active ? "Deaktivieren" : "Aktivieren"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger sm:col-span-2"
                  disabled={busyId === c.id}
                  onClick={() => setConfirmDelete(c)}
                >
                  <Trash2 className="size-5" aria-hidden />
                  Löschen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-code-title"
        >
          <div className="glass w-full max-w-md space-y-4 rounded-2xl p-5">
            <h2 id="delete-code-title" className="font-display text-[22px] font-semibold">
              Code wirklich löschen?
            </h2>
            <p className="text-[16px] text-[var(--text-muted)]">
              {confirmDelete.label || "Ohne Label"} ·{" "}
              <span className="font-mono">{confirmDelete.code}</span>
            </p>
            <div className="grid gap-3">
              <button type="button" className="btn btn-danger" onClick={confirmRemove}>
                <Trash2 className="size-5" aria-hidden />
                Endgültig löschen
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
