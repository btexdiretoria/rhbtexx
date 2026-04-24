CREATE TABLE IF NOT EXISTS public.overtime_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  colaborador text NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  matched boolean NOT NULL DEFAULT false,
  horas numeric NOT NULL DEFAULT 0,
  valor numeric NOT NULL DEFAULT 0,
  file_name text,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS overtime_entries_year_month_idx ON public.overtime_entries (year, month);

ALTER TABLE public.overtime_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.overtime_entries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_overtime_entries_updated_at
BEFORE UPDATE ON public.overtime_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('overtime-files', 'overtime-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Overtime files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'overtime-files');

CREATE POLICY "Authenticated can upload overtime files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'overtime-files');

CREATE POLICY "Authenticated can update overtime files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'overtime-files');

CREATE POLICY "Authenticated can delete overtime files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'overtime-files');