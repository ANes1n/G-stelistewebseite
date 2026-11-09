import type { CookieOptionsWithName } from "@supabase/ssr";

/** Shared cookie options (~400 days, path /, SameSite=Lax, Secure in production). */
export const authCookieOptions: CookieOptionsWithName = {
  path: "/",
  sameSite: "lax",
  maxAge: 400 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
};
