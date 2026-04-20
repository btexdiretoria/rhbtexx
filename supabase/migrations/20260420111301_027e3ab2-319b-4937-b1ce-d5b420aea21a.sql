CREATE TABLE public.calendar_week_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_key TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_week_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
ON public.calendar_week_notes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_calendar_week_notes_updated_at
BEFORE UPDATE ON public.calendar_week_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_calendar_week_notes_week_key ON public.calendar_week_notes(week_key);