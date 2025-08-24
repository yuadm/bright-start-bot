-- Add missing columns to job_applications table  
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS reference_info jsonb,
ADD COLUMN IF NOT EXISTS emergency_contact jsonb;