"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/zusagen", label: "Zusagen" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/settings", label: "Einstellungen" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="glass fixed top-0 bottom-0 left-0 z-20 hidden w-56 flex-col border-r border-white/10 p-4 pt-[max(1rem,env(safe-area-inset-top))] md:flex">
        <p className="font-display accent-text text-sm font-semibold tracking-wide uppercase">
          Admin
        </p>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`touch-target flex items-center rounded-xl px-3 text-sm font-medium ${
                  active ? "accent-gradient text-[#0b0614]" : "hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="touch-target w-full rounded-xl text-left text-sm text-[var(--text-muted)] hover:text-white"
          >
            Abmelden
          </button>
        </form>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="glass fixed inset-x-0 bottom-0 z-20 border-t border-white/10 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`touch-target flex flex-1 items-center justify-center rounded-xl text-xs font-medium ${
                  active ? "accent-gradient text-[#0b0614]" : "text-[var(--text-muted)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <form action="/api/auth/logout" method="post" className="flex flex-1">
            <button
              type="submit"
              className="touch-target flex w-full items-center justify-center rounded-xl text-xs text-[var(--text-muted)]"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
