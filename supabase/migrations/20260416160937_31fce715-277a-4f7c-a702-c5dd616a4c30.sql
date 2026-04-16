CREATE TABLE public.food_voucher_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year integer NOT NULL,
  month integer NOT NULL,
  benefit_day integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

ALTER TABLE public.food_voucher_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.food_voucher_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);