ALTER TABLE public.daily_summary
  ADD COLUMN IF NOT EXISTS resultado_comp_inicio text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS resultado_comp_ontem text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS resultado_comp_hoje text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS receitas_esperadas_comp text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS despesas_programadas_comp text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS alteracoes_comp jsonb DEFAULT '[]'::jsonb;