-- Create deliveries table
CREATE TABLE public.calendar_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  working_days INTEGER NOT NULL,
  color TEXT NOT NULL,
  color_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.calendar_deliveries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create receipts table linked to deliveries
CREATE TABLE public.calendar_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES public.calendar_deliveries(id) ON DELETE CASCADE,
  receipt_date DATE NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.calendar_receipts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_calendar_deliveries_updated_at
BEFORE UPDATE ON public.calendar_deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_receipts_updated_at
BEFORE UPDATE ON public.calendar_receipts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_calendar_deliveries_dates ON public.calendar_deliveries(start_date, end_date);
CREATE INDEX idx_calendar_receipts_date ON public.calendar_receipts(receipt_date);
CREATE INDEX idx_calendar_receipts_delivery ON public.calendar_receipts(delivery_id);