-- ============================================================
-- SmartSpend — Smart Personal Expense Tracker
-- Phase 1 Initial Database Schema
-- Target: Supabase PostgreSQL (Public Schema)
-- ============================================================

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    description TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTE ON ROW LEVEL SECURITY (RLS) FOR PHASE 1:
-- For this initial Phase 1 lab prototype, Row Level Security (RLS)
-- can be left disabled or enabled with public read/write access policies
-- so you can test database connectivity before authentication is wired up.
--
-- In Phase 2/3, when Supabase Auth (e.g. Google OAuth / JWT) is added,
-- a 'user_id' column linked to auth.users and RLS policies MUST be
-- enabled to isolate transactions per user for production security.
-- ============================================================

-- If RLS is enabled in Supabase by default, execute the following policy
-- to allow the development client with the 'anon' key to test access:
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access during development"
ON public.transactions
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert access during development"
ON public.transactions
FOR INSERT
TO anon
WITH CHECK (true);
