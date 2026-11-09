"use client";

import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions } from "./cookie-options";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** One browser client singleton for the whole app. */
export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase public env vars");
  }

  browserClient = createBrowserClient(url, key, {
    cookieOptions: authCookieOptions,
  });

  return browserClient;
}
