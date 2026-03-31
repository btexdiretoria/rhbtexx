
-- Employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  foto TEXT DEFAULT '',
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  rg TEXT DEFAULT '',
  data_nascimento DATE,
  genero TEXT DEFAULT 'Masculino',
  endereco_rua TEXT DEFAULT '',
  endereco_numero TEXT DEFAULT '',
  endereco_bairro TEXT DEFAULT '',
  endereco_cidade TEXT DEFAULT '',
  endereco_estado TEXT DEFAULT '',
  endereco_cep TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  chave_pix TEXT,
  tipo_chave_pix TEXT,
  email_pessoal TEXT DEFAULT '',
  matricula TEXT NOT NULL,
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  centro_custo TEXT DEFAULT '',
  data_admissao DATE NOT NULL,
  tipo_contrato TEXT NOT NULL DEFAULT 'CLT',
  salario NUMERIC(12,2) NOT NULL DEFAULT 0,
  carga_horaria INTEGER DEFAULT 40,
  email_corporativo TEXT DEFAULT '',
  gestor_direto TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Ativo',
  data_desligamento DATE,
  motivo_desligamento TEXT,
  valor_rescisao NUMERIC(12,2),
  data_pagamento_rescisao DATE,
  pagamento_confirmado BOOLEAN DEFAULT false,
  contrato_assinado BOOLEAN DEFAULT false,
  data_fim_experiencia DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  periodo TEXT NOT NULL,
  data DATE NOT NULL,
  produtividade NUMERIC(3,1) NOT NULL DEFAULT 0,
  comunicacao NUMERIC(3,1) NOT NULL DEFAULT 0,
  trabalho_equipe NUMERIC(3,1) NOT NULL DEFAULT 0,
  proatividade NUMERIC(3,1) NOT NULL DEFAULT 0,
  lideranca NUMERIC(3,1) NOT NULL DEFAULT 0,
  resultados NUMERIC(3,1) NOT NULL DEFAULT 0,
  pontos_fortes TEXT DEFAULT '',
  pontos_melhoria TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee history / timeline
CREATE TABLE public.employee_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  responsavel TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee documents
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data_upload DATE NOT NULL DEFAULT CURRENT_DATE,
  tamanho TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Net salary columns definition per month
CREATE TABLE public.net_salary_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  column_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earning', 'deduction')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year, month, column_id)
);

-- Net salary values per employee per month
CREATE TABLE public.net_salary_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  column_id TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, year, month, column_id)
);

-- Food voucher entries per employee per month
CREATE TABLE public.food_voucher_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_method TEXT NOT NULL DEFAULT 'Alelo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, year, month)
);

-- Transportation voucher entries per employee per month
CREATE TABLE public.transport_voucher_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  payment1_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment1_date TEXT DEFAULT '',
  payment2_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment2_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, year, month)
);

-- Expense control categories per month
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  name TEXT NOT NULL,
  forecast NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  target_id TEXT,
  description TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_salary_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_salary_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies: authenticated users can do everything (single-tenant app)
CREATE POLICY "Authenticated users full access" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.employee_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.employee_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.net_salary_columns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.net_salary_values FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.food_voucher_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.transport_voucher_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
