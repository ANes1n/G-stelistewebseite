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
      className="glass space-y-5 rounded-2xl p-5 text-center"
    >
      <div>
        <p className="accent-text font-display text-sm font-semibold tracking-wide uppercase">
          Geschafft
        </p>
        <h2 className="font-display mt-2 text-3xl font-bold">
          Danke, {firstName}!
        </h2>
        <p className="mt-3 text-[15px] text-[var(--text-muted)]">
          Speichere diesen Link, um deine Antwort später zu ändern.
        </p>
      </div>

      <p className="break-all rounded-xl bg-black/25 px-3 py-3 text-left text-xs text-[var(--text-muted)]">
        {manageUrl}
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={copyLink}
          className="touch-target accent-gradient rounded-xl text-sm font-semibold text-[#0b0614]"
        >
          {copied ? "Kopiert!" : "Link kopieren"}
        </button>
        <a
          href={`/api/ics?token=${encodeURIComponent(manageToken)}`}
          className="touch-target glass inline-flex items-center justify-center rounded-xl text-sm font-medium"
        >
          Zum Kalender hinzufügen
        </a>
      </div>
    </motion.div>
  );
}
