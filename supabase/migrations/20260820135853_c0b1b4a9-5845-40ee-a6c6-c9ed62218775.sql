ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS atestado_acompanhante boolean DEFAULT false;