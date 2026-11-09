import Script from "next/script";
import { notFound } from "next/navigation";
import { PartyDetails } from "@/components/invite/PartyDetails";
import { RsvpForm } from "@/components/invite/RsvpForm";
import { validateInviteCode } from "@/lib/invite-code";
import {
  canAcceptYes,
  countYesRsvps,
  defaultSettings,
  getSettings,
} from "@/lib/rsvp-state";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function EinladungPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const validated = await validateInviteCode(code);
  if (!validated) notFound();

  const settings = (await getSettings()) ?? defaultSettings();
  const yesCount = await countYesRsvps();
  const capacity = canAcceptYes(settings, yesCount);
  // Form closed for new submissions when RSVP closed/deadline; "full" still
  // allows "komme_nicht" — handled in API. UI shows closed only when no new
  // "komme" possible AND we want a soft close message for all — keep form
  // open unless rsvp_open false or past deadline; full shows warning via API.
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
      <PartyDetails />
      <RsvpForm
        code={code!.trim()}
        formClosed={formClosed}
        formClosedReason={formClosedReason}
        turnstileSiteKey={turnstileSiteKey || undefined}
      />
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
