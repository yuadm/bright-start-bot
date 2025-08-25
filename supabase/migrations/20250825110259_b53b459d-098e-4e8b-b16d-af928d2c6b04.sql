-- Fix the reference_requests table to add missing reference_type column
ALTER TABLE reference_requests ADD COLUMN IF NOT EXISTS reference_type text NOT NULL DEFAULT 'character';

-- Update the table to ensure all required fields are present
ALTER TABLE reference_requests 
ALTER COLUMN reference_type SET DEFAULT 'character',
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS form_data jsonb,
ADD COLUMN IF NOT EXISTS is_expired boolean DEFAULT false;