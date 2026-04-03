
-- Departments table
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON public.departments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default departments
INSERT INTO public.departments (name) VALUES
  ('Tecnologia'), ('Recursos Humanos'), ('Financeiro'), ('Comercial'), ('Marketing'), ('Operações');

-- Company settings table (single-row)
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT 'GestãoPeople',
  cnpj text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON public.company_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default row
INSERT INTO public.company_settings (company_name, cnpj, email, phone)
VALUES ('GestãoPeople LTDA', '12.345.678/0001-90', 'contato@gestapeople.com', '(11) 3000-0000');
