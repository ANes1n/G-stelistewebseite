import Link from "next/link";

export default function NotFound() {
  return (
    <main className="safe-pad flex min-h-dvh items-center justify-center">
      <div className="mx-auto max-w-sm text-center">
        <p className="text-sm text-[var(--text-muted)]">404</p>
        <h1 className="font-display mt-2 text-2xl font-semibold">
          Nicht gefunden
        </h1>
        <p className="mt-3 text-[15px] text-[var(--text-muted)]">
          Diese Seite ist nicht verfügbar.
        </p>
        <Link
          href="/"
          className="touch-target accent-gradient mt-8 inline-flex items-center justify-center rounded-xl px-5 text-sm font-semibold text-[#0b0614]"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
