-- ============================================================
-- SmartSpend — Smart Personal Expense Tracker
-- Phase 1 & 2 Database Schema
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
-- NOTE ON ROW LEVEL SECURITY (RLS) FOR DEVELOPMENT:
-- For this initial lab prototype, Row Level Security (RLS)
-- policies allow the development client with the 'anon' key to test CRUD operations.
--
-- In Phase 3+, when Supabase Auth (e.g. Google OAuth / JWT) is added,
-- a 'user_id' column linked to auth.users and per-user RLS policies MUST be
-- enabled to isolate transactions per user for production security.
-- ============================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. Read (SELECT)
CREATE POLICY "Allow anon read access during development"
ON public.transactions
FOR SELECT
TO anon
USING (true);

-- 2. Create (INSERT)
CREATE POLICY "Allow anon insert access during development"
ON public.transactions
FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Update (UPDATE)
CREATE POLICY "Allow anon update access during development"
ON public.transactions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 4. Delete (DELETE)
CREATE POLICY "Allow anon delete access during development"
ON public.transactions
FOR DELETE
TO anon
USING (true);
