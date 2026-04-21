CREATE TABLE public.cashflow_bucket_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket text NOT NULL,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category)
);

ALTER TABLE public.cashflow_bucket_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.cashflow_bucket_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_cashflow_bucket_categories_bucket ON public.cashflow_bucket_categories(bucket);