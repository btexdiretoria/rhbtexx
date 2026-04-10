
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS data_inicio_aviso_previo date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desconto_alimentacao numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_faltas numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS aviso_previo_ciente boolean DEFAULT false;
