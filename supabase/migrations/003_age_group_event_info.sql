-- 003: age_group, withdrawn status, event_info card
-- Safe to re-run where possible. Run in Supabase SQL Editor AFTER deploy.

-- ---------------------------------------------------------------------------
-- RSVPs: age_group + was_confirmed + status zurückgezogen
-- ---------------------------------------------------------------------------

ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS age_group text;

ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS was_confirmed boolean NOT NULL DEFAULT false;

-- Migrate from legacy boolean columns when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rsvps' AND column_name = 'over18'
  ) THEN
    UPDATE public.rsvps
    SET age_group = CASE
      WHEN over18 IS TRUE THEN '18_plus'
      WHEN over16 IS TRUE THEN '16_17'
      ELSE 'u16'
    END
    WHERE age_group IS NULL;
  ELSE
    UPDATE public.rsvps SET age_group = 'u16' WHERE age_group IS NULL;
  END IF;
END $$;

ALTER TABLE public.rsvps
  ALTER COLUMN age_group SET DEFAULT 'u16';

ALTER TABLE public.rsvps
  ALTER COLUMN age_group SET NOT NULL;

ALTER TABLE public.rsvps
  DROP CONSTRAINT IF EXISTS rsvps_age_group_check;

ALTER TABLE public.rsvps
  ADD CONSTRAINT rsvps_age_group_check
  CHECK (age_group IN ('u16', '16_17', '18_plus'));

-- Expand status values
ALTER TABLE public.rsvps DROP CONSTRAINT IF EXISTS rsvps_status_check;
ALTER TABLE public.rsvps
  ADD CONSTRAINT rsvps_status_check
  CHECK (status IN ('ausstehend', 'bestätigt', 'abgelehnt', 'zurückgezogen'));

-- Keep response, default to komme (submitting = wanting to come)
ALTER TABLE public.rsvps
  ALTER COLUMN response SET DEFAULT 'komme';

ALTER TABLE public.rsvps DROP COLUMN IF EXISTS over16;
ALTER TABLE public.rsvps DROP COLUMN IF EXISTS over18;

-- ---------------------------------------------------------------------------
-- Replace atomic RSVP RPC (age_group instead of over16/over18)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_rsvp_atomic(
  uuid, text, text, text, boolean, boolean, text, text, boolean
);

CREATE OR REPLACE FUNCTION public.create_rsvp_atomic(
  p_invite_code_id uuid,
  p_first_name text,
  p_last_name text,
  p_age_group text,
  p_note text,
  p_manage_token_hash text,
  p_increment_code boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.settings%ROWTYPE;
  v_code public.invite_codes%ROWTYPE;
  v_yes_count integer;
  v_id uuid;
BEGIN
  IF p_age_group NOT IN ('u16', '16_17', '18_plus') THEN
    RAISE EXCEPTION 'invalid_age_group';
  END IF;

  SELECT * INTO v_settings
  FROM public.settings
  WHERE id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'settings_missing';
  END IF;

  IF NOT v_settings.rsvp_open THEN
    RAISE EXCEPTION 'rsvp_closed';
  END IF;

  IF v_settings.rsvp_deadline IS NOT NULL AND now() > v_settings.rsvp_deadline THEN
    RAISE EXCEPTION 'rsvp_deadline';
  END IF;

  SELECT count(*)::integer INTO v_yes_count
  FROM public.rsvps
  WHERE response = 'komme'
    AND status IS DISTINCT FROM 'zurückgezogen';

  IF v_yes_count >= v_settings.max_rsvps THEN
    RAISE EXCEPTION 'rsvp_full';
  END IF;

  IF p_increment_code THEN
    IF p_invite_code_id IS NULL THEN
      RAISE EXCEPTION 'invalid_code';
    END IF;

    SELECT * INTO v_code
    FROM public.invite_codes
    WHERE id = p_invite_code_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_code.active THEN
      RAISE EXCEPTION 'invalid_code';
    END IF;

    IF v_code.expires_at IS NOT NULL AND now() > v_code.expires_at THEN
      RAISE EXCEPTION 'code_expired';
    END IF;

    IF v_code.uses >= v_code.max_uses THEN
      RAISE EXCEPTION 'code_used_up';
    END IF;

    UPDATE public.invite_codes
    SET uses = uses + 1
    WHERE id = p_invite_code_id;
  END IF;

  INSERT INTO public.rsvps (
    first_name,
    last_name,
    response,
    age_group,
    note,
    status,
    invite_code_id,
    manage_token_hash
  ) VALUES (
    p_first_name,
    p_last_name,
    'komme',
    p_age_group,
    NULLIF(p_note, ''),
    'ausstehend',
    p_invite_code_id,
    p_manage_token_hash
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_rsvp_atomic(
  uuid, text, text, text, text, text, boolean
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_rsvp_atomic(
  uuid, text, text, text, text, text, boolean
) TO service_role;

-- ---------------------------------------------------------------------------
-- event_info (single invitation card for the whole site)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_info (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  party_name text NOT NULL DEFAULT 'Party',
  tagline text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  time_label text NOT NULL DEFAULT '',
  time_label_override boolean NOT NULL DEFAULT false,
  place_name text NOT NULL DEFAULT '',
  place_street text NOT NULL DEFAULT '',
  place_city text NOT NULL DEFAULT '',
  place_notes text NOT NULL DEFAULT '',
  dress_code text NOT NULL DEFAULT '',
  age_info text NOT NULL DEFAULT '',
  rsvp_hint text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  extra_info text NOT NULL DEFAULT '',
  calendar_summary text NOT NULL DEFAULT '',
  calendar_description text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.event_info (
  id,
  party_name,
  tagline,
  starts_at,
  ends_at,
  time_label,
  time_label_override,
  place_name,
  place_street,
  place_city,
  place_notes,
  dress_code,
  age_info,
  rsvp_hint,
  contact_name,
  contact_phone,
  contact_email,
  extra_info,
  calendar_summary,
  calendar_description
) VALUES (
  1,
  'Geburtstagsparty',
  'Du bist eingeladen',
  timestamptz '2026-12-22 20:00:00+01',
  timestamptz '2026-12-23 06:00:00+01',
  'ab 20:00 Uhr bis in den Morgen',
  true,
  '',
  '',
  '',
  '',
  '',
  'Bitte gib deine Altersgruppe an.',
  'Bitte bis Anfang Dezember anmelden.',
  '',
  '',
  '',
  '',
  'Geburtstagsparty',
  'Private Feier — Details folgen über deine Einladung.'
)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS event_info_set_updated_at ON public.event_info;
CREATE TRIGGER event_info_set_updated_at
  BEFORE UPDATE ON public.event_info
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON TABLE public.event_info FROM PUBLIC, anon, authenticated;
ALTER TABLE public.event_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_info FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.event_info IS 'Single invitation card; admin via service role only.';
