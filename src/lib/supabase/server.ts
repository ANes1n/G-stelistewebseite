import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions } from "./cookie-options";

/**
 * Server Components / Route Handlers: read session via getUser only.
 * Session refresh happens exclusively in proxy.ts — setAll is a no-op here.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase public env vars");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Intentionally empty: proxy.ts is the only place that refreshes cookies.
      },
    },
  });
}
