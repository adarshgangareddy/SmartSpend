-- ==============================================================================
-- SmartSpend Migration: 001_auth_and_profiles.sql
-- Description: Sets up public.profiles, auto-creation triggers on auth.users,
--              associates transactions with user_id, and hardens RLS policies.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create the public.profiles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    preferred_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. Automatic Profile Creation Trigger on auth.users
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, preferred_currency)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'INR')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. Automatic updated_at Timestamp Trigger on public.profiles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Update public.transactions Table (Add user_id Column & Index)
-- ------------------------------------------------------------------------------
-- Adds user_id foreign key referencing auth.users without touching existing records
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- ------------------------------------------------------------------------------
-- 5. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. Row Level Security Policies for public.profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 7. Row Level Security Policies for public.transactions
-- ------------------------------------------------------------------------------
-- Remove dev-mode anon policies if they exist
DROP POLICY IF EXISTS "Allow anon read access during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow anon insert access during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow anon update access during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow anon delete access during development" ON public.transactions;

-- Strict authenticated user policies enforcing auth.uid() ownership
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. Safe Handling of Existing NULL user_id Records
-- ------------------------------------------------------------------------------
-- Note: Existing transactions remain intact with user_id = NULL.
-- Once your first authenticated user registers in Supabase Auth, you can optionally
-- assign existing legacy demo transactions to that user by running:
--
-- UPDATE public.transactions
-- SET user_id = '<YOUR_AUTHENTICATED_USER_UUID>'
-- WHERE user_id IS NULL;
-- ==============================================================================
