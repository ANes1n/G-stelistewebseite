"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  firstName: string;
  manageUrl: string;
  manageToken: string;
};

export function SuccessScreen({ firstName, manageUrl, manageToken }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(manageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass w-full max-w-full space-y-5 rounded-2xl p-4 text-center sm:p-5"
    >
      <div>
        <p className="accent-text font-display text-[13px] font-semibold tracking-wide uppercase">
          Geschafft
        </p>
        <h2 className="heading-2 mt-2 font-bold">Danke, {firstName}!</h2>
        <p className="mt-3 text-[16px] text-[var(--text-muted)]">
          Speichere diesen Link, um deine Antwort später zu ändern.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-muted)]">
          Alle Anmeldungen werden von uns manuell geprüft. Du bekommst eine
          Bestätigung von uns.
        </p>
        <p className="mt-2 text-[14px] font-medium text-amber-100">
          Status: Wird geprüft
        </p>
      </div>

      <p className="break-all rounded-xl bg-black/25 px-3 py-3 text-left text-[13px] text-[var(--text-muted)]">
        {manageUrl}
      </p>

      <div className="flex flex-col gap-3">
        <button type="button" onClick={copyLink} className="btn btn-primary">
          {copied ? "Kopiert!" : "Link kopieren"}
        </button>
        <a
          href={`/api/ics?token=${encodeURIComponent(manageToken)}`}
          className="btn btn-secondary"
        >
          Zum Kalender hinzufügen
        </a>
      </div>
    </motion.div>
  );
}
