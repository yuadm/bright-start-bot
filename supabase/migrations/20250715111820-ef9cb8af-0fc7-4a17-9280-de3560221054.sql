
-- Create a table to track compliance data retention and archival
CREATE TABLE public.compliance_data_retention (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_type_id UUID NOT NULL REFERENCES public.compliance_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  period_type TEXT NOT NULL, -- 'annual', 'monthly', 'quarterly', 'bi-annual', 'weekly'
  period_identifier TEXT NOT NULL, -- '2024', '2024-01', '2024-Q1', '2024-H1', '2024-W01'
  data_summary JSONB, -- Summary statistics for the period
  archive_due_date DATE, -- When this data should be archived
  download_available_date DATE, -- When download becomes available (3 months before deletion)
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index for efficient querying
CREATE INDEX idx_compliance_data_retention_type_year ON public.compliance_data_retention(compliance_type_id, year);
CREATE INDEX idx_compliance_data_retention_archive_dates ON public.compliance_data_retention(archive_due_date, download_available_date);

-- Create a table to store actual compliance records with period tracking
CREATE TABLE public.compliance_period_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_type_id UUID NOT NULL REFERENCES public.compliance_types(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_identifier TEXT NOT NULL, -- '2024', '2024-01', '2024-Q1', etc.
  completion_date DATE NOT NULL,
  next_due_date DATE,
  completed_by UUID REFERENCES public.employees(id),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_compliance_period_records_type_period ON public.compliance_period_records(compliance_type_id, period_identifier);
CREATE INDEX idx_compliance_period_records_employee ON public.compliance_period_records(employee_id);
CREATE INDEX idx_compliance_period_records_dates ON public.compliance_period_records(completion_date, next_due_date);

-- Enable RLS on new tables
ALTER TABLE public.compliance_data_retention ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_period_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for compliance_data_retention
CREATE POLICY "Allow all authenticated users to view compliance data retention" 
ON public.compliance_data_retention 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow public read access to compliance data retention" 
ON public.compliance_data_retention 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Admins can manage compliance data retention" 
ON public.compliance_data_retention 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create RLS policies for compliance_period_records
CREATE POLICY "Allow all authenticated users to view compliance period records" 
ON public.compliance_period_records 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow public read access to compliance period records" 
ON public.compliance_period_records 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Admins can manage compliance period records" 
ON public.compliance_period_records 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create a function to calculate period identifiers based on frequency
CREATE OR REPLACE FUNCTION public.get_period_identifier(
  frequency TEXT,
  target_date DATE DEFAULT CURRENT_DATE
) RETURNS TEXT AS $$
BEGIN
  CASE frequency
    WHEN 'annual' THEN
      RETURN EXTRACT(YEAR FROM target_date)::TEXT;
    WHEN 'monthly' THEN
      RETURN TO_CHAR(target_date, 'YYYY-MM');
    WHEN 'quarterly' THEN
      RETURN EXTRACT(YEAR FROM target_date)::TEXT || '-Q' || EXTRACT(QUARTER FROM target_date)::TEXT;
    WHEN 'bi-annual' THEN
      RETURN EXTRACT(YEAR FROM target_date)::TEXT || '-H' || 
             CASE WHEN EXTRACT(MONTH FROM target_date) <= 6 THEN '1' ELSE '2' END;
    WHEN 'weekly' THEN
      RETURN TO_CHAR(target_date, 'YYYY-"W"IW');
    ELSE
      RETURN EXTRACT(YEAR FROM target_date)::TEXT;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate archive dates based on frequency
CREATE OR REPLACE FUNCTION public.calculate_archive_dates(
  frequency TEXT,
  base_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
) RETURNS TABLE(
  archive_due_date DATE,
  download_available_date DATE
) AS $$
DECLARE
  retention_years INTEGER;
  archive_date DATE;
BEGIN
  -- Set retention period based on frequency (all keep 6 years worth of data)
  retention_years := 6;
  
  -- Calculate when data should be archived (after retention period)
  archive_date := (base_year + retention_years + 1)::TEXT || '-01-01'::DATE;
  
  RETURN QUERY SELECT 
    archive_date as archive_due_date,
    (archive_date - INTERVAL '3 months')::DATE as download_available_date;
END;
$$ LANGUAGE plpgsql;
