import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/supabase/cookie-options";

export const dynamic = "force-dynamic";

async function logoutAndRedirect(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieStore = await cookies();
  const redirectTo = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectTo, { status: 303 });

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.signOut({ scope: "global" });
  }

  // Belt-and-suspenders: clear every sb-* cookie.
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        ...authCookieOptions,
        maxAge: 0,
      });
    }
  }

  return response;
}

export async function GET(request: Request) {
  return logoutAndRedirect(request);
}

export async function POST(request: Request) {
  return logoutAndRedirect(request);
}
