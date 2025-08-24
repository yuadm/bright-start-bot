
-- Remove all existing RLS policies from leave_types table
DROP POLICY IF EXISTS "All users can view leave types" ON public.leave_types;
DROP POLICY IF EXISTS "Authenticated users can create leave types" ON public.leave_types;
DROP POLICY IF EXISTS "Authenticated users can update leave types" ON public.leave_types;
DROP POLICY IF EXISTS "Authenticated users can delete leave types" ON public.leave_types;

-- Disable RLS completely on leave_types table to remove all restrictions
ALTER TABLE public.leave_types DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on branches table if it has restrictions
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;

-- Remove any existing policies on branches
DROP POLICY IF EXISTS "Admins can do everything" ON public.branches;

-- Make sure the leaves table also doesn't have restrictive policies
ALTER TABLE public.leaves DISABLE ROW LEVEL SECURITY;
