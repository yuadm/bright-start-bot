
-- Let's completely remove any existing constraints and recreate them properly
-- First, drop ALL constraints on the role column
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Get all check constraints on the user_roles table that involve the role column
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.user_roles'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- Now add the correct constraint with the exact roles your app uses
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'manager', 'hr', 'user'));

-- Let's also check what data currently exists and might be causing issues
-- First, let's see what role values are currently in the table
SELECT role, COUNT(*) as count FROM user_roles GROUP BY role;

-- Update any invalid role values to valid ones if they exist
UPDATE user_roles SET role = 'admin' WHERE role NOT IN ('admin', 'manager', 'hr', 'user');
