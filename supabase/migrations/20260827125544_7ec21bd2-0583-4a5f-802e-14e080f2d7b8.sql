CREATE TABLE public.hr_process_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL,
  nome text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_process_templates TO authenticated;
GRANT ALL ON public.hr_process_templates TO service_role;
ALTER TABLE public.hr_process_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage hr_process_templates" ON public.hr_process_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_hr_process_templates_updated_at BEFORE UPDATE ON public.hr_process_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.hr_process_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  data_referencia date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_process_cases TO authenticated;
GRANT ALL ON public.hr_process_cases TO service_role;
ALTER TABLE public.hr_process_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage hr_process_cases" ON public.hr_process_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_hr_process_cases_updated_at BEFORE UPDATE ON public.hr_process_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.hr_process_case_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.hr_process_cases(id) ON DELETE CASCADE,
  nome text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  concluido boolean NOT NULL DEFAULT false,
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_process_case_steps TO authenticated;
GRANT ALL ON public.hr_process_case_steps TO service_role;
ALTER TABLE public.hr_process_case_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage hr_process_case_steps" ON public.hr_process_case_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_hr_process_case_steps_updated_at BEFORE UPDATE ON public.hr_process_case_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.hr_process_templates (tipo, nome, sort_order) VALUES
  ('admissao', 'Documentos recebidos', 1),
  ('admissao', 'Contrato assinado', 2),
  ('admissao', 'Exame admissional', 3),
  ('admissao', 'Cadastro no sistema', 4),
  ('demissao', 'Aviso prévio comunicado', 1),
  ('demissao', 'Exame demissional', 2),
  ('demissao', 'Cálculo da rescisão', 3),
  ('demissao', 'Pagamento da rescisão', 4);