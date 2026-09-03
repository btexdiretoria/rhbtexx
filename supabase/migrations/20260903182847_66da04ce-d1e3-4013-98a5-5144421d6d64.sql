ALTER TABLE public.transport_voucher_entries
  ADD COLUMN IF NOT EXISTS payment1_ref_start DATE,
  ADD COLUMN IF NOT EXISTS payment1_ref_end DATE,
  ADD COLUMN IF NOT EXISTS payment2_ref_start DATE,
  ADD COLUMN IF NOT EXISTS payment2_ref_end DATE;