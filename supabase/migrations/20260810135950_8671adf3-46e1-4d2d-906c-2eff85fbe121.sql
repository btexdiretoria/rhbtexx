CREATE TABLE public.dre_category_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  group_name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_category_map TO authenticated;
GRANT ALL ON public.dre_category_map TO service_role;
ALTER TABLE public.dre_category_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage dre category map"
  ON public.dre_category_map FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_dre_category_map_updated_at
  BEFORE UPDATE ON public.dre_category_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.dre_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL UNIQUE,
  file_name text,
  months jsonb NOT NULL DEFAULT '[]'::jsonb,
  rows_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_datasets TO authenticated;
GRANT ALL ON public.dre_datasets TO service_role;
ALTER TABLE public.dre_datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage dre datasets"
  ON public.dre_datasets FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_dre_datasets_updated_at
  BEFORE UPDATE ON public.dre_datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();