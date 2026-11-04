-- ==============================================================================
-- Migration: 003_exchange_rates.sql
-- Description: Creates public.exchange_rates cache table for historical foreign exchange rates.
-- Compatible with multi-currency historical conversion engine.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    date DATE NOT NULL,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    rates JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, base_currency)
);

-- Index for speedy date and base lookup
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON public.exchange_rates (date DESC);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow public read access to exchange rates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'exchange_rates' AND policyname = 'Public read access to exchange rates'
    ) THEN
        CREATE POLICY "Public read access to exchange rates"
            ON public.exchange_rates
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Allow service role full access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'exchange_rates' AND policyname = 'Service role full access to exchange rates'
    ) THEN
        CREATE POLICY "Service role full access to exchange rates"
            ON public.exchange_rates
            FOR ALL
            USING (auth.jwt() ->> 'role' = 'service_role' OR current_user = 'postgres');
    END IF;
END $$;
