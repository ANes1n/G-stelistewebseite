import { notFound } from "next/navigation";
import { ManageForm } from "@/components/invite/ManageForm";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgeGroup } from "@/lib/format-event";
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
      "id, first_name, last_name, age_group, note, status, was_confirmed, response, manage_token_hash",
    )
    .eq("manage_token_hash", tokenHash)
    .maybeSingle();

  if (!data || !hashEquals(raw, data.manage_token_hash)) {
    notFound();
  }

  const settings = await getSettings();
  if (!settings) notFound();

  const yesCount = await countYesRsvps();
  const active =
    data.response === "komme" && data.status !== "zurückgezogen";
  const capacity = canAcceptYes(
    settings,
    active ? Math.max(0, yesCount - 1) : yesCount,
  );
  const canReregister = capacity.ok;

  return (
    <main className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center py-8">
      <ManageForm
        token={raw}
        firstName={data.first_name}
        lastName={data.last_name}
        ageGroup={data.age_group as AgeGroup}
        initialNote={data.note ?? ""}
        initialStatus={data.status}
        wasBestätigt={Boolean(data.was_confirmed)}
        canReregister={canReregister}
        blockedReason={canReregister ? undefined : capacity.reason}
      />
    </main>
  );
}
