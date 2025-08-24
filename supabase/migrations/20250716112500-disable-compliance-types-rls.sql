
-- Disable RLS completely on compliance_types table since user management isn't set up yet
-- This will remove all restrictions and allow full CRUD operations

-- First, drop all existing policies to clean up
DROP POLICY IF EXISTS "Allow all authenticated users to view compliance types" ON public.compliance_types;
DROP POLICY IF EXISTS "Allow public read access to compliance types" ON public.compliance_types;
DROP POLICY IF EXISTS "Admins can manage compliance types" ON public.compliance_types;
DROP POLICY IF EXISTS "Allow authenticated users to view compliance types" ON public.compliance_types;

-- Disable RLS completely on the compliance_types table
ALTER TABLE public.compliance_types DISABLE ROW LEVEL SECURITY;

-- Add a comment to explain why RLS is disabled
COMMENT ON TABLE public.compliance_types IS 'RLS disabled - user management not yet implemented';
