"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Ticket,
  Settings,
  LogOut,
} from "lucide-react";

const links = [
  { href: "/admin/zusagen", label: "Zusagen", icon: Users },
  { href: "/admin/codes", label: "Codes", icon: Ticket },
  { href: "/admin/settings", label: "Einstellungen", icon: Settings, match: ["/admin/settings", "/admin/einstellungen"] },
];

function isActive(pathname: string, href: string, match?: string[]) {
  if (match) return match.some((m) => pathname.startsWith(m));
  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="glass fixed top-0 bottom-0 left-0 z-20 hidden w-60 flex-col border-r border-white/10 p-4 pt-[max(1rem,env(safe-area-inset-top))] md:flex">
        <p className="font-display accent-text text-sm font-semibold tracking-wide uppercase">
          Admin
        </p>
        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {links.map((link) => {
            const active = isActive(pathname, link.href, link.match);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`touch-target-lg flex items-center gap-3 rounded-2xl px-3 text-[16px] font-medium ${
                  active
                    ? "btn-primary shadow-md"
                    : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="touch-target-lg flex w-full items-center gap-3 rounded-2xl px-3 text-left text-[16px] text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-5" aria-hidden />
            Logout
          </button>
        </form>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="glass admin-tabbar fixed inset-x-0 bottom-0 z-20 border-t border-white/10 px-2 pt-2 md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
          {links.map((link) => {
            const active = isActive(pathname, link.href, link.match);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold tracking-wide ${
                  active
                    ? "bg-gradient-to-br from-violet-600 to-pink-600 text-white shadow-md"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 2} aria-hidden />
                <span>{link.label === "Einstellungen" ? "Einstell." : link.label}</span>
              </Link>
            );
          })}
          <form action="/api/auth/logout" method="post" className="flex flex-1">
            <button
              type="submit"
              className="flex min-h-[60px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold tracking-wide text-[var(--text-muted)]"
            >
              <LogOut className="size-6" aria-hidden />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
