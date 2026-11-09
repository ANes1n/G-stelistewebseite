-- Ensure the single settings row exists (safe to re-run).
-- Paste into the Supabase SQL Editor if Einstellungen still fails after deploy.

INSERT INTO public.settings (id, rsvp_open, rsvp_deadline, max_rsvps, global_code_enabled)
VALUES (1, true, NULL, 150, true)
ON CONFLICT (id) DO NOTHING;
