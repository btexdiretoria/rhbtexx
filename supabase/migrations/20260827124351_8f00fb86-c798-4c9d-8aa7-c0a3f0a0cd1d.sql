ALTER TABLE public.cashflow_state
  ADD COLUMN IF NOT EXISTS valor_previsto_comp numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_previsto_anual_comp numeric NOT NULL DEFAULT 0;