-- Birthday Invitation RSVP schema
-- Run manually in the Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invite_codes_code_length CHECK (char_length(code) >= 10)
);

CREATE TABLE IF NOT EXISTS public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  response text NOT NULL CHECK (response IN ('komme', 'komme_nicht')),
  over16 boolean NOT NULL DEFAULT false,
  over18 boolean NOT NULL DEFAULT false,
  note text,
  status text NOT NULL DEFAULT 'ausstehend'
    CHECK (status IN ('ausstehend', 'bestätigt', 'abgelehnt')),
  invite_code_id uuid REFERENCES public.invite_codes (id) ON DELETE SET NULL,
  manage_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rsvps_note_length CHECK (note IS NULL OR char_length(note) <= 200),
  CONSTRAINT rsvps_first_name_length CHECK (char_length(first_name) BETWEEN 1 AND 80),
  CONSTRAINT rsvps_last_name_length CHECK (char_length(last_name) BETWEEN 1 AND 80)
);

CREATE TABLE IF NOT EXISTS public.settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rsvp_open boolean NOT NULL DEFAULT true,
  rsvp_deadline timestamptz,
  max_rsvps integer NOT NULL DEFAULT 150 CHECK (max_rsvps >= 1),
  global_code_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rsvps_set_updated_at ON public.rsvps;
CREATE TRIGGER rsvps_set_updated_at
  BEFORE UPDATE ON public.rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS settings_set_updated_at ON public.settings;
CREATE TRIGGER settings_set_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS rsvps_manage_token_hash_idx ON public.rsvps (manage_token_hash);
CREATE INDEX IF NOT EXISTS rsvps_status_idx ON public.rsvps (status);
CREATE INDEX IF NOT EXISTS rsvps_response_idx ON public.rsvps (response);
CREATE INDEX IF NOT EXISTS invite_codes_active_idx ON public.invite_codes (active);

-- ---------------------------------------------------------------------------
-- Atomic RSVP create + optional invite code increment
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_rsvp_atomic(
  p_invite_code_id uuid,
  p_first_name text,
  p_last_name text,
  p_response text,
  p_over16 boolean,
  p_over18 boolean,
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

  IF p_response NOT IN ('komme', 'komme_nicht') THEN
    RAISE EXCEPTION 'invalid_response';
  END IF;

  IF p_response = 'komme' THEN
    SELECT count(*)::integer INTO v_yes_count
    FROM public.rsvps
    WHERE response = 'komme';

    IF v_yes_count >= v_settings.max_rsvps THEN
      RAISE EXCEPTION 'rsvp_full';
    END IF;
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
    over16,
    over18,
    note,
    status,
    invite_code_id,
    manage_token_hash
  ) VALUES (
    p_first_name,
    p_last_name,
    p_response,
    p_over16,
    p_over18,
    NULLIF(p_note, ''),
    'ausstehend',
    p_invite_code_id,
    p_manage_token_hash
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Privileges & RLS
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.invite_codes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.rsvps FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.settings FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.create_rsvp_atomic(
  uuid, text, text, text, boolean, boolean, text, text, boolean
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_rsvp_atomic(
  uuid, text, text, text, boolean, boolean, text, text, boolean
) TO service_role;

-- Service role bypasses RLS; still enable RLS so anon/authenticated get nothing.
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- No policies for anon. Authenticated also gets no direct table access;
-- admin reads/writes go through the Next.js server with the service role
-- after verifying ADMIN_EMAIL.
ALTER TABLE public.invite_codes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settings FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.invite_codes IS 'Private invite codes; no anon access.';
COMMENT ON TABLE public.rsvps IS 'RSVP entries; guests never see other guests.';
COMMENT ON TABLE public.settings IS 'Single-row RSVP settings.';
