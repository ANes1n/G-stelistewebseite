import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { InvitationCard } from "@/components/invite/InvitationCard";
import { RsvpForm } from "@/components/invite/RsvpForm";
import { getEventInfo } from "@/lib/event-info";
import { validateInviteCode } from "@/lib/invite-code";
import {
  canAcceptYes,
  countYesRsvps,
  defaultSettings,
  getSettings,
} from "@/lib/rsvp-state";

export const dynamic = "force-dynamic";

const PRIVACY =
  "Deine Angaben dienen ausschließlich der Gästeplanung. Nach der Feier werden sie gelöscht. Es gibt keine öffentliche Gästeliste.";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function AnmeldenPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const raw = code?.trim() ?? "";
  const validated = await validateInviteCode(raw);
  if (!validated) notFound();

  const event = await getEventInfo();
  const settings = (await getSettings()) ?? defaultSettings();
  const yesCount = await countYesRsvps();
  const capacity = canAcceptYes(settings, yesCount);
  const formClosed =
    !settings.rsvp_open || capacity.reason === "deadline";
  const formClosedReason = !settings.rsvp_open
    ? ("closed" as const)
    : capacity.reason === "deadline"
      ? ("deadline" as const)
      : undefined;

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  return (
    <main className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 py-8">
      <InvitationCard event={event} compact />
      <RsvpForm
        code={raw}
        formClosed={formClosed}
        formClosedReason={formClosedReason}
        turnstileSiteKey={turnstileSiteKey || undefined}
        privacyNote={PRIVACY}
      />
      <Link
        href={`/einladung?code=${encodeURIComponent(raw)}`}
        className="text-center text-[15px] text-[var(--text-muted)] underline-offset-2 hover:underline"
      >
        Zurück zur Einladung
      </Link>
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      ) : null}
    </main>
  );
}
