import Link from "next/link";
import { notFound } from "next/navigation";
import { InvitationCard } from "@/components/invite/InvitationCard";
import { getEventInfo } from "@/lib/event-info";
import { validateInviteCode } from "@/lib/invite-code";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function EinladungLandingPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const raw = code?.trim() ?? "";
  const validated = await validateInviteCode(raw);
  if (!validated) notFound();

  const event = await getEventInfo();

  return (
    <main className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 py-8">
      <InvitationCard event={event} />

      <div className="flex flex-col gap-3">
        <Link
          href={`/einladung/anmelden?code=${encodeURIComponent(raw)}`}
          className="btn btn-primary"
        >
          Jetzt anmelden
        </Link>
        <a href="#einladung-details" className="btn btn-secondary">
          Alle Infos ansehen
        </a>
      </div>
    </main>
  );
}
