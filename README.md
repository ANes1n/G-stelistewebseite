# Birthday Invitation (RSVP)

Private birthday invitation with RSVP — Next.js App Router (TypeScript, Tailwind) + Supabase.

Party: **22.12.2026 (evening) → 23.12.2026**. UI language: German.

This is a standalone project (not related to “Party Control”).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@supabase/ssr` + `@supabase/supabase-js`
- Zod validation, Framer Motion, Google fonts via `next/font`
- Session refresh only in `src/proxy.ts` (Next.js 16 name for middleware)

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run these files (in order):

   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_ensure_settings.sql` (safe to re-run; seeds the settings row)
   - `supabase/migrations/003_age_group_event_info.sql` (age_group, withdrawn status, `event_info` card)

3. In **Authentication → Users**, create the admin user (email + password).  
   There is no public registration page.
4. Copy **Project URL**, **anon/publishable key**, and **service_role key** from **Project Settings → API**.

### 2. Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server only, never expose to the client |
| `ADMIN_EMAIL` | Must match the Auth user email (only this account reaches `/admin`) |
| `INVITE_CODE` | Optional global fallback code (10+ chars); can be disabled in Einstellungen |
| `NEXT_PUBLIC_SITE_URL` | Public origin, no trailing slash (e.g. `https://dein-host.vercel.app`) |
| `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional Turnstile site key |

### 3. Party texts

Edit placeholders in `src/config/party.ts` (title, place, dress code, contact, calendar, …).

### 4. Run locally

```bash
npm install
npm run dev
```

- Neutral root: `http://localhost:3000/`
- Invitation: `http://localhost:3000/einladung?code=YOUR_CODE`
- Admin: `http://localhost:3000/login` → `/admin`

### 5. Create invite codes

Sign in as `ADMIN_EMAIL`, open **Codes**, create single/bulk codes, copy links.

## Vercel

Set the same env vars in the Vercel project. Deploy. After deploy, set `NEXT_PUBLIC_SITE_URL` to the production URL and redeploy if needed.

## Security notes

- RLS is enabled on all tables; `anon` / `public` have no privileges or policies.
- Public writes go through server routes + `SECURITY DEFINER` RPC (`create_rsvp_atomic`), executable only by `service_role`.
- Manage links use a one-time plain token; only the SHA-256 hash is stored.
- All pages send `noindex` / `X-Robots-Tag`; `robots.txt` disallows everything.
- PWA manifest + icons are included; **no service worker caching**.

## Scripts

```bash
npm run build   # production build (must pass)
npm run dev
npm run lint
npm run test:security   # local security smoke tests (needs env + DB)
```
