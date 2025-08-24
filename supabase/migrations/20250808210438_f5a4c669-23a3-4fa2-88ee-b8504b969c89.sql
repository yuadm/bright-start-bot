-- Add linking columns to spot_check_records for association with compliance records
ALTER TABLE public.spot_check_records
ADD COLUMN IF NOT EXISTS employee_id uuid NULL,
ADD COLUMN IF NOT EXISTS compliance_type_id uuid NULL,
ADD COLUMN IF NOT EXISTS period_identifier text NULL;

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_spot_check_records_employee ON public.spot_check_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_spot_check_records_type_period ON public.spot_check_records(compliance_type_id, period_identifier);
