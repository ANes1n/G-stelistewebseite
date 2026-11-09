"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signError) {
        setError("Anmeldung fehlgeschlagen.");
        return;
      }

      // ADMIN_EMAIL is enforced in the admin layout (server-side).
      router.replace("/admin/zusagen");
      router.refresh();
    } catch {
      setError("Anmeldung fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="safe-pad flex min-h-dvh items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="glass w-full max-w-sm space-y-4 rounded-2xl p-6"
      >
        <h1 className="font-display text-2xl font-semibold">Login</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Nur für Administratoren.
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--text-muted)]">
            E-Mail
          </span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base outline-none focus:border-violet-300/60"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--text-muted)]">
            Passwort
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="touch-target w-full rounded-xl border border-white/15 bg-white/5 px-3 text-base outline-none focus:border-violet-300/60"
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="touch-target accent-gradient w-full rounded-xl text-sm font-semibold text-[#0b0614] disabled:opacity-60"
        >
          {pending ? "…" : "Anmelden"}
        </button>
      </form>
    </main>
  );
}
