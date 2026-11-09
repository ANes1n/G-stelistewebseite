"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

export type ToastState = {
  kind: ToastKind;
  message: string;
  /** Bumps so the same message can show again */
  id?: number;
} | null;

type Props = {
  toast: ToastState;
  onClose: () => void;
  durationMs?: number;
};

export function Toast({ toast, onClose, durationMs = 4000 }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => onClose(), durationMs);
    return () => window.clearTimeout(t);
    // Re-arm when a new toast is shown (id bumps on every showToast).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id, toast?.kind, toast?.message, durationMs]);

  if (!toast || !mounted) return null;

  const Icon = toast.kind === "error" ? AlertCircle : CheckCircle2;
  const tone =
    toast.kind === "error"
      ? "border-rose-400/40 bg-rose-950/95 text-rose-50"
      : toast.kind === "success"
        ? "border-emerald-400/40 bg-emerald-950/95 text-emerald-50"
        : "border-white/20 bg-slate-950/95 text-white";

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-[max(1rem,env(safe-area-inset-top))] right-4 left-4 z-[9999] mx-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md md:left-auto ${tone}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="flex-1 text-[16px] leading-snug font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="touch-target-lg -mr-1 -mt-1 inline-flex size-10 items-center justify-center rounded-xl hover:bg-white/10"
        aria-label="Schließen"
      >
        <X className="size-4" />
      </button>
    </div>,
    document.body,
  );
}

/** Clipboard with textarea fallback (works without secure-context permissions). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
