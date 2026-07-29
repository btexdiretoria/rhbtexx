
CREATE TABLE public.daily_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_date DATE NOT NULL UNIQUE,
  dias_uteis_restante TEXT DEFAULT '',
  faturamento_necessario TEXT DEFAULT '',
  despesas JSONB DEFAULT '[]'::jsonb,
  resultado_inicio TEXT DEFAULT '',
  resultado_ontem TEXT DEFAULT '',
  resultado_hoje TEXT DEFAULT '',
  alteracoes JSONB DEFAULT '[]'::jsonb,
  receitas_dia TEXT DEFAULT '',
  despesas_dia TEXT DEFAULT '',
  avisos JSONB DEFAULT '[]'::jsonb,
  anotacoes TEXT DEFAULT '',
  assinaturas JSONB DEFAULT '[]'::jsonb,
  card_order JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_summary TO authenticated;
GRANT ALL ON public.daily_summary TO service_role;
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON public.daily_summary FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_daily_summary_updated_at BEFORE UPDATE ON public.daily_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
