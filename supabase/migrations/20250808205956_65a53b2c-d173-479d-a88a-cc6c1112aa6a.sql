-- Create table to store spot check forms
CREATE TABLE IF NOT EXISTS public.spot_check_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  service_user_name text NOT NULL,
  care_worker1 text NOT NULL,
  care_worker2 text NULL,
  check_date date NOT NULL,
  time_from text NOT NULL,
  time_to text NOT NULL,
  carried_by text NOT NULL,
  observations jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NULL
);

-- Enable RLS
ALTER TABLE public.spot_check_records ENABLE ROW LEVEL SECURITY;

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_spot_check_records_updated_at ON public.spot_check_records;
CREATE TRIGGER update_spot_check_records_updated_at
BEFORE UPDATE ON public.spot_check_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Policies: admins manage all; authenticated users can view and insert
DROP POLICY IF EXISTS "Admins can manage spot_check_records" ON public.spot_check_records;
CREATE POLICY "Admins can manage spot_check_records"
ON public.spot_check_records
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Authenticated users can view spot_check_records" ON public.spot_check_records;
CREATE POLICY "Authenticated users can view spot_check_records"
ON public.spot_check_records
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert spot_check_records" ON public.spot_check_records;
CREATE POLICY "Authenticated users can insert spot_check_records"
ON public.spot_check_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Optional: allow updates by creator
DROP POLICY IF EXISTS "Creators can update their own spot_check_records" ON public.spot_check_records;
CREATE POLICY "Creators can update their own spot_check_records"
ON public.spot_check_records
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR is_admin_user())
WITH CHECK (created_by = auth.uid() OR is_admin_user());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spot_check_records_check_date ON public.spot_check_records(check_date);
CREATE INDEX IF NOT EXISTS idx_spot_check_records_created_by ON public.spot_check_records(created_by);
