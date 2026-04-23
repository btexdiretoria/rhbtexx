
-- Cashflow persisted state (single row per workspace; using a fixed key for now)
CREATE TABLE IF NOT EXISTS public.cashflow_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_key text NOT NULL UNIQUE DEFAULT 'default',
  file_name text,
  file_path text,
  entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_date text,
  end_date text,
  saved_edits jsonb NOT NULL DEFAULT '{}'::jsonb,
  date_edits jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  alteracoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashflow_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.cashflow_state
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_cashflow_state_updated_at
BEFORE UPDATE ON public.cashflow_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for the uploaded spreadsheet
INSERT INTO storage.buckets (id, name, public)
VALUES ('cashflow-files', 'cashflow-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Cashflow files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'cashflow-files');

CREATE POLICY "Authenticated can upload cashflow files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cashflow-files');

CREATE POLICY "Authenticated can update cashflow files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cashflow-files');

CREATE POLICY "Authenticated can delete cashflow files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cashflow-files');
