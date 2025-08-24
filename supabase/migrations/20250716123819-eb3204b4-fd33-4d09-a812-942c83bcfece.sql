
-- First, let's see what roles are currently allowed and update the constraint
-- Drop the existing check constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add a new check constraint that allows the roles your application uses
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'manager', 'hr', 'user'));

-- Also ensure we don't have any conflicting enum types
-- If there's an enum type, we might need to use that instead
DO $$
BEGIN
    -- Check if app_role enum exists and drop the constraint to use enum instead
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
        ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If enum doesn't exist, the check constraint above will work
        NULL;
END $$;
