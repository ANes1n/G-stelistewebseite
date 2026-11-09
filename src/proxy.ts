import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions } from "@/lib/supabase/cookie-options";

/**
 * Next.js 16 request Proxy (formerly middleware).
 * THIS is the only place that refreshes the Supabase session and writes cookies
 * to both the request and the response (official SSR guide pattern).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([headerKey, headerValue]) => {
            response.headers.set(headerKey, headerValue);
          });
        },
      },
    });

    // Refresh session — do not use getSession() here.
    await supabase.auth.getUser();
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    // Soft gate: detailed ADMIN_EMAIL check happens in the admin layout.
    // Here we only bounce clearly unauthenticated browsers to /login.
    const hasSbCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.value);
    if (!hasSbCookie) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Exclude static assets, Next internals, manifest and icons.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
