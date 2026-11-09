export default function HomePage() {
  return (
    <main className="safe-pad flex min-h-dvh items-center justify-center">
      <div className="mx-auto max-w-sm text-center">
        <p className="text-sm tracking-wide text-[var(--text-muted)]">
          Private Seite
        </p>
        <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight">
          Zugang nur mit Link
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-muted)]">
          Wenn du eine Einladung erhalten hast, öffne bitte den persönlichen
          Link aus deiner Nachricht.
        </p>
      </div>
    </main>
  );
}
