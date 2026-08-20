GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_summary TO authenticated;
GRANT ALL ON public.daily_summary TO service_role;

ALTER TABLE public.daily_summary
  ADD COLUMN IF NOT EXISTS resultado_acumulado text,
  ADD COLUMN IF NOT EXISTS possiveis_perdas text,
  ADD COLUMN IF NOT EXISTS controle_ausencias jsonb NOT NULL DEFAULT '[]'::jsonb;