ALTER TABLE public.daily_summary
  ADD COLUMN IF NOT EXISTS receitas_receber JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS receitas_esperadas TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS despesas_programadas TEXT NOT NULL DEFAULT '';