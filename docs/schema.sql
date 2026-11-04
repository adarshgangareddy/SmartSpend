-- ============================================================
-- SmartSpend — Smart Personal Expense Tracker
-- Complete Database Schema & Development RLS Policies
-- Target: Supabase PostgreSQL (Public Schema)
-- ============================================================

-- 1. Create transactions table
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

-- 2. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they already exist (prevents Error 42710)
DROP POLICY IF EXISTS "Allow anon read access during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow anon insert access during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow anon update access during development" ON public.transactions;
DROP POLICY IF EXISTS "Allow anon delete access during development" ON public.transactions;

-- 4. Re-create all 4 CRUD policies for anon development access

-- Read (SELECT)
CREATE POLICY "Allow anon read access during development"
ON public.transactions
FOR SELECT
TO anon
USING (true);

-- Create (INSERT)
CREATE POLICY "Allow anon insert access during development"
ON public.transactions
FOR INSERT
TO anon
WITH CHECK (true);

-- Update (UPDATE)
CREATE POLICY "Allow anon update access during development"
ON public.transactions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Delete (DELETE)
CREATE POLICY "Allow anon delete access during development"
ON public.transactions
FOR DELETE
TO anon
USING (true);
