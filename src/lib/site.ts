export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

export function inviteLink(code: string): string {
  return `${getSiteUrl()}/einladung?code=${encodeURIComponent(code)}`;
}

export function manageLink(token: string): string {
  return `${getSiteUrl()}/einladung/manage?token=${encodeURIComponent(token)}`;
}
