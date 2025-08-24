-- Phase 2: Performance indexes for job applications
-- Ensure efficient filtering, sorting, and pagination

-- Index on created_at for ordering and date range filters
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at
  ON public.job_applications (created_at DESC);

-- Index on status for status filtering
CREATE INDEX IF NOT EXISTS idx_job_applications_status
  ON public.job_applications (status);

-- Index on position_id for potential position filters
CREATE INDEX IF NOT EXISTS idx_job_applications_position_id
  ON public.job_applications (position_id);

-- GIN index on personal_info JSONB for contains/search filters
CREATE INDEX IF NOT EXISTS idx_job_applications_personal_info
  ON public.job_applications USING GIN (personal_info);
