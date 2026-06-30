-- ============================================================
-- KenyaPlus Database Schema
-- Run this in your Supabase SQL Editor
-- Project: https://app.supabase.com
-- ============================================================

-- ============================================================
-- Table: survey_responses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id             UUID        DEFAULT gen_random_uuid()   PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW()               NOT NULL,
  county         TEXT                                    NOT NULL,
  constituency   TEXT                                    NOT NULL,
  ward           TEXT                                    NOT NULL,
  full_name           TEXT                              NOT NULL,
  phone_number        TEXT                              UNIQUE,
  gender              TEXT                              NOT NULL,
  age_group           TEXT                              NOT NULL,
  preferred_president TEXT                              NOT NULL,
  preferred_governor  TEXT                              NOT NULL,
  support_reason      TEXT                              NOT NULL,
  biggest_issue       TEXT                              NOT NULL,
  issue_details       TEXT        DEFAULT ''
);

-- Safe migrations — each block skips if already applied
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'survey_responses'
      AND column_name  = 'preferred_president'
  ) THEN
    ALTER TABLE public.survey_responses
      ADD COLUMN preferred_president TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'survey_responses'
      AND column_name  = 'phone_number'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.survey_responses
      ALTER COLUMN phone_number DROP NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'survey_responses_phone_unique'
  ) THEN
    ALTER TABLE public.survey_responses
      ADD CONSTRAINT survey_responses_phone_unique UNIQUE (phone_number);
  END IF;
END $$;

-- Indexes for common filter operations
CREATE INDEX IF NOT EXISTS idx_surveys_county    ON public.survey_responses (county);
CREATE INDEX IF NOT EXISTS idx_surveys_gender    ON public.survey_responses (gender);
CREATE INDEX IF NOT EXISTS idx_surveys_age_group ON public.survey_responses (age_group);
CREATE INDEX IF NOT EXISTS idx_surveys_created   ON public.survey_responses (created_at DESC);

-- ============================================================
-- Table: aspirants
-- ============================================================
CREATE TABLE IF NOT EXISTS public.aspirants (
  id           UUID        DEFAULT gen_random_uuid()   PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW()               NOT NULL,
  full_name    TEXT                                    NOT NULL,
  county       TEXT                                    NOT NULL,
  seat         TEXT                                    NOT NULL,
  party        TEXT        DEFAULT '',
  phone_number TEXT                                    NOT NULL,
  brief_bio    TEXT                                    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aspirants_county  ON public.aspirants (county);
CREATE INDEX IF NOT EXISTS idx_aspirants_seat    ON public.aspirants (seat);
CREATE INDEX IF NOT EXISTS idx_aspirants_created ON public.aspirants (created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirants         ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (public survey & aspirant registration)
CREATE POLICY "Public can insert survey responses"
  ON public.survey_responses
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Public can insert aspirants"
  ON public.aspirants
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anyone to SELECT (admin reads via anon key; protect in production)
CREATE POLICY "Public can read survey responses"
  ON public.survey_responses
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Public can read aspirants"
  ON public.aspirants
  FOR SELECT TO anon
  USING (true);

-- ============================================================
-- Sample data (optional — remove in production)
-- ============================================================
-- INSERT INTO public.aspirants (full_name, county, seat, party, phone_number, brief_bio)
-- VALUES
--   ('Jane Wanjiku Mwangi', 'Nairobi', 'Governor', 'ODM', '0712345678',
--    'A seasoned public administrator with 15 years of experience. I will transform Nairobi into a world-class city.'),
--   ('Peter Otieno Odhiambo', 'Kisumu', 'Senator', 'Jubilee', '0798765432',
--    'Kisumu deserves better healthcare and roads. I will champion the voice of Kisumu in the Senate.'),
--   ('Mary Achieng Onyango', 'Mombasa', 'Woman Representative', 'UDA', '0701234567',
--    'Women and youth are the backbone of Mombasa. I will fight for equal opportunities and coastal rights.');
