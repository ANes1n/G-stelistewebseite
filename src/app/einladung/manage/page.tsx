import { notFound } from "next/navigation";
import { ManageForm } from "@/components/invite/ManageForm";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canAcceptYes,
  countYesRsvps,
  getSettings,
} from "@/lib/rsvp-state";
import { hashEquals, hashToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ManagePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const raw = token?.trim() ?? "";
  if (raw.length < 20) notFound();

  const tokenHash = hashToken(raw);
  const admin = createAdminClient();
  const { data } = await admin
    .from("rsvps")
    .select(
      "id, first_name, last_name, response, over16, over18, note, manage_token_hash",
    )
    .eq("manage_token_hash", tokenHash)
    .maybeSingle();

  if (!data || !hashEquals(raw, data.manage_token_hash)) {
    notFound();
  }

  const settings = await getSettings();
  if (!settings) notFound();

  const yesCount = await countYesRsvps();
  // If already "komme", switching away and back should still work unless
  // capacity would be exceeded by a NEW yes — already counted.
  const alreadyYes = data.response === "komme";
  const capacity = canAcceptYes(settings, alreadyYes ? yesCount - 1 : yesCount);
  const canSwitchToYes = capacity.ok;

  return (
    <main className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center py-8">
      <ManageForm
        token={raw}
        firstName={data.first_name}
        lastName={data.last_name}
        over16={data.over16}
        over18={data.over18}
        initialResponse={data.response as "komme" | "komme_nicht"}
        initialNote={data.note ?? ""}
        canSwitchToYes={canSwitchToYes || alreadyYes}
        blockedReason={
          canSwitchToYes || alreadyYes ? undefined : capacity.reason
        }
      />
    </main>
  );
}
