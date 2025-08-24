-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create compliance automation settings table
CREATE TABLE IF NOT EXISTS public.compliance_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  auto_generate_records BOOLEAN NOT NULL DEFAULT true,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  notification_days_before INTEGER NOT NULL DEFAULT 14,
  escalation_days INTEGER NOT NULL DEFAULT 30,
  auto_archive_completed BOOLEAN NOT NULL DEFAULT false
);

-- Insert default settings
INSERT INTO public.compliance_automation_settings (auto_generate_records, grace_period_days, notification_days_before, escalation_days, auto_archive_completed)
VALUES (true, 7, 14, 30, false)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.compliance_automation_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for compliance automation settings
CREATE POLICY "Admins can manage compliance automation settings"
ON public.compliance_automation_settings
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Add status tracking columns to compliance_period_records
ALTER TABLE public.compliance_period_records 
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS grace_period_end DATE,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_notification_sent TIMESTAMPTZ;

-- Create function to automatically generate compliance records for new periods
CREATE OR REPLACE FUNCTION public.generate_compliance_records_for_period(
  p_compliance_type_id UUID,
  p_period_identifier TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  records_created INTEGER := 0;
  emp_record RECORD;
  automation_settings RECORD;
BEGIN
  -- Get automation settings
  SELECT * INTO automation_settings 
  FROM compliance_automation_settings 
  LIMIT 1;
  
  -- Only proceed if auto generation is enabled
  IF NOT automation_settings.auto_generate_records THEN
    RETURN 0;
  END IF;

  -- Generate records for all active employees
  FOR emp_record IN 
    SELECT id FROM employees WHERE is_active = true
  LOOP
    -- Check if record already exists
    IF NOT EXISTS (
      SELECT 1 FROM compliance_period_records 
      WHERE compliance_type_id = p_compliance_type_id 
      AND employee_id = emp_record.id 
      AND period_identifier = p_period_identifier
    ) THEN
      -- Create new compliance record
      INSERT INTO compliance_period_records (
        compliance_type_id,
        employee_id,
        period_identifier,
        status,
        auto_generated,
        grace_period_end,
        completion_date,
        notes
      ) VALUES (
        p_compliance_type_id,
        emp_record.id,
        p_period_identifier,
        'pending',
        true,
        CURRENT_DATE + INTERVAL '1 day' * automation_settings.grace_period_days,
        '',
        'Auto-generated for period: ' || p_period_identifier
      );
      
      records_created := records_created + 1;
    END IF;
  END LOOP;
  
  RETURN records_created;
END;
$$;

-- Create function to update compliance statuses
CREATE OR REPLACE FUNCTION public.update_compliance_statuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  records_updated INTEGER := 0;
  automation_settings RECORD;
BEGIN
  -- Get automation settings
  SELECT * INTO automation_settings 
  FROM compliance_automation_settings 
  LIMIT 1;
  
  -- Update overdue status for pending records
  UPDATE compliance_period_records
  SET 
    is_overdue = true,
    status = 'overdue'
  WHERE 
    status = 'pending' 
    AND grace_period_end < CURRENT_DATE
    AND is_overdue = false;
    
  GET DIAGNOSTICS records_updated = ROW_COUNT;
  
  RETURN records_updated;
END;
$$;

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_compliance_automation_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automation settings
CREATE TRIGGER update_compliance_automation_settings_updated_at
  BEFORE UPDATE ON public.compliance_automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_compliance_automation_settings_updated_at();