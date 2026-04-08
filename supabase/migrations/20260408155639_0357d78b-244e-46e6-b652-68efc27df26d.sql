CREATE TABLE public.department_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_name TEXT NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.department_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.department_managers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_department_managers_updated_at
BEFORE UPDATE ON public.department_managers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();