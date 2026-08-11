ALTER TABLE public.daily_summary
  ADD COLUMN IF NOT EXISTS controle_semanal jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS objetivo_faturamento text,
  ADD COLUMN IF NOT EXISTS saldo_inicial_dia text,
  ADD COLUMN IF NOT EXISTS saldo_final_dia text;