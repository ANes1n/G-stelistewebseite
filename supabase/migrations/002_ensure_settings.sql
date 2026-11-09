-- Ensure settings table + single row exist (safe to re-run).
-- If you already ran 001_init.sql, this only inserts the row when missing.
-- If you have NOT run 001 yet, run 001_init.sql first (full schema).
-- This file alone is enough to unblock /admin/settings.

CREATE TABLE IF NOT EXISTS public.settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rsvp_open boolean NOT NULL DEFAULT true,
  rsvp_deadline timestamptz,
  max_rsvps integer NOT NULL DEFAULT 150 CHECK (max_rsvps >= 1),
  global_code_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.settings (id, rsvp_open, rsvp_deadline, max_rsvps, global_code_enabled)
VALUES (1, true, NULL, 150, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.settings FROM PUBLIC, anon, authenticated;
