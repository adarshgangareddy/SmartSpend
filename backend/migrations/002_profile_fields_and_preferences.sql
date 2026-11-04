-- ==============================================================================
-- SmartSpend Migration: 002_profile_fields_and_preferences.sql
-- Description: Extends public.profiles with bio, phone, location, dob, avatar_url,
--              theme, and date_format preferences.
-- ==============================================================================

-- 1. Add extra profile and personalization fields to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS theme VARCHAR(40) NOT NULL DEFAULT 'lavender-glass',
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY';

-- 2. Optional: Create public avatars storage bucket if not present
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for avatars
DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;
CREATE POLICY "Public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update worldly avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

