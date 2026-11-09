import "server-only";

import { generateInviteCode } from "@/lib/invite-code";
import { inviteLink } from "@/lib/site";
import type { SettingsRow } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";

/** Local QA only: never enable on production hosts. */
export function isAdminUiPreview(): boolean {
  if (process.env.ADMIN_UI_PREVIEW !== "1") return false;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  return (
    process.env.NODE_ENV === "development" ||
    site.includes("localhost") ||
    site.includes("127.0.0.1")
  );
}

type PreviewCode = {
  id: string;
  code: string;
  label: string;
  max_uses: number;
  uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

const g = globalThis as unknown as {
  __invitePreviewCodes?: PreviewCode[];
  __invitePreviewSettings?: SettingsRow;
};

function codes(): PreviewCode[] {
  if (!g.__invitePreviewCodes) g.__invitePreviewCodes = [];
  return g.__invitePreviewCodes;
}

function settingsStore(): SettingsRow {
  if (!g.__invitePreviewSettings) {
    g.__invitePreviewSettings = { ...DEFAULT_SETTINGS };
  }
  return g.__invitePreviewSettings;
}

export function previewListCodes() {
  return codes()
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((row) => ({
      ...row,
      link: inviteLink(row.code),
      overused: row.uses > row.max_uses,
    }));
}

export function previewCreateCodes(input: {
  label: string;
  maxUses: number;
  count: number;
  expiresAt: string | null;
}) {
  const created: PreviewCode[] = [];
  for (let i = 0; i < input.count; i++) {
    const row: PreviewCode = {
      id: crypto.randomUUID(),
      code: generateInviteCode(12),
      label: input.label,
      max_uses: input.maxUses,
      uses: 0,
      active: true,
      expires_at: input.expiresAt,
      created_at: new Date().toISOString(),
    };
    codes().unshift(row);
    created.push(row);
  }
  return created.map((row) => ({ ...row, link: inviteLink(row.code) }));
}

export function previewToggleCode(id: string, active: boolean) {
  const row = codes().find((c) => c.id === id);
  if (!row) return false;
  row.active = active;
  return true;
}

export function previewDeleteCode(id: string) {
  const list = codes();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  list.splice(idx, 1);
  return true;
}

export function previewGetSettings(): SettingsRow {
  return { ...settingsStore() };
}

export function previewUpdateSettings(
  patch: Partial<SettingsRow>,
): SettingsRow {
  const current = settingsStore();
  g.__invitePreviewSettings = {
    ...current,
    ...patch,
    id: 1,
  };
  return { ...g.__invitePreviewSettings };
}
