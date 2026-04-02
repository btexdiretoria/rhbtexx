
CREATE TABLE public.system_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  cargo text NOT NULL DEFAULT '',
  departamento text NOT NULL DEFAULT '',
  nivel_acesso text NOT NULL DEFAULT 'Visualizador',
  status text NOT NULL DEFAULT 'Ativo',
  ultimo_acesso timestamp with time zone DEFAULT now(),
  avatar text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON public.system_users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_system_users_updated_at
  BEFORE UPDATE ON public.system_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
