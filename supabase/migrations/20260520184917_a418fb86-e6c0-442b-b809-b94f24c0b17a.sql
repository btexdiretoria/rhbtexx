ALTER TABLE public.cashflow_state
ADD COLUMN IF NOT EXISTS alteracoes_anual jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS valor_previsto_anual numeric NOT NULL DEFAULT 0;