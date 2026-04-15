-- Financial dashboard monthly data (admin-entered)
CREATE TABLE public.financial_dashboard_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  average_price numeric NOT NULL DEFAULT 0,
  daily_production_avg numeric NOT NULL DEFAULT 0,
  total_pieces numeric NOT NULL DEFAULT 0,
  working_days integer NOT NULL DEFAULT 22,
  revenue_goal numeric NOT NULL DEFAULT 0,
  revenue_billed numeric NOT NULL DEFAULT 0,
  working_days_passed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

ALTER TABLE public.financial_dashboard_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON public.financial_dashboard_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User section permissions
CREATE TABLE public.user_section_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.system_users(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  has_access boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_key)
);

ALTER TABLE public.user_section_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON public.user_section_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);