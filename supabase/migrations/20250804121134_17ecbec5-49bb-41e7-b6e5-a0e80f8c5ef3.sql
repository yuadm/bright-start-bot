-- Enhance compliance_data_retention table for better archival management
ALTER TABLE compliance_data_retention 
ADD COLUMN IF NOT EXISTS retention_policy_years INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS archival_status TEXT DEFAULT 'pending' CHECK (archival_status IN ('pending', 'processing', 'archived', 'failed')),
ADD COLUMN IF NOT EXISTS archival_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archival_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS download_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_records_archived INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_statistics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS archival_notes TEXT;

-- Create indexes for efficient archival queries
CREATE INDEX IF NOT EXISTS idx_compliance_data_retention_status ON compliance_data_retention(archival_status);
CREATE INDEX IF NOT EXISTS idx_compliance_data_retention_due_date ON compliance_data_retention(archive_due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_data_retention_type_year ON compliance_data_retention(compliance_type_id, year);

-- Create function to calculate archival readiness
CREATE OR REPLACE FUNCTION check_archival_readiness(p_compliance_type_id UUID, p_year INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if all compliance records for the type/year are completed or overdue beyond grace period
  RETURN NOT EXISTS (
    SELECT 1 FROM compliance_period_records cpr
    WHERE cpr.compliance_type_id = p_compliance_type_id
    AND EXTRACT(YEAR FROM CASE 
      WHEN cpr.completion_date ~ '^\d{4}-\d{2}-\d{2}$' 
      THEN cpr.completion_date::DATE 
      ELSE CURRENT_DATE 
    END) = p_year
    AND cpr.status IN ('pending', 'in_progress')
    AND (cpr.grace_period_end IS NULL OR cpr.grace_period_end > CURRENT_DATE - INTERVAL '30 days')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate compliance statistics for archival
CREATE OR REPLACE FUNCTION generate_compliance_statistics(p_compliance_type_id UUID, p_year INTEGER)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_records', COUNT(*),
    'completed_records', COUNT(*) FILTER (WHERE status = 'completed'),
    'overdue_records', COUNT(*) FILTER (WHERE status = 'overdue'),
    'pending_records', COUNT(*) FILTER (WHERE status = 'pending'),
    'completion_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ),
    'average_completion_days', AVG(
      CASE 
        WHEN status = 'completed' AND completion_date ~ '^\d{4}-\d{2}-\d{2}$'
        THEN EXTRACT(DAY FROM completion_date::DATE - created_at::DATE)
        ELSE NULL
      END
    ),
    'unique_employees', COUNT(DISTINCT employee_id),
    'period_identifiers', array_agg(DISTINCT period_identifier ORDER BY period_identifier)
  ) INTO stats
  FROM compliance_period_records
  WHERE compliance_type_id = p_compliance_type_id
  AND EXTRACT(YEAR FROM CASE 
    WHEN completion_date ~ '^\d{4}-\d{2}-\d{2}$' 
    THEN completion_date::DATE 
    ELSE created_at::DATE 
  END) = p_year;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;