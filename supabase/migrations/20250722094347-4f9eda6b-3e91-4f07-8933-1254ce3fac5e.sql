
-- Drop the employee_accounts table since we don't want it
DROP TABLE IF EXISTS public.employee_accounts CASCADE;

-- Add password-related fields to the existing employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set default password hash for '123456' for all employees that don't have a password yet
UPDATE public.employees 
SET password_hash = crypt('123456', gen_salt('bf'))
WHERE password_hash IS NULL;

-- Make password_hash NOT NULL after setting defaults
ALTER TABLE public.employees ALTER COLUMN password_hash SET NOT NULL;
