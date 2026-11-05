-- Add server-managed application roles without changing existing profile records.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_role_valid'
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_role_valid
            CHECK (role IN ('admin', 'user'));
    END IF;
END;
$$;

-- Direct authenticated profile updates must not permit role escalation.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role
    AND COALESCE(auth.role(), current_user, '') NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'Profile role can only be changed by a trusted administrator';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_escalation();

COMMENT ON COLUMN public.profiles.role IS
    'SmartSpend role; changes are restricted to trusted server-side service-role operations.';