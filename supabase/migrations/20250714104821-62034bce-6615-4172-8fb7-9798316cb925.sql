-- Fix infinite recursion in user_roles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user has admin role
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Create new RLS policies using the security definer function
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Allow users to view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS on employees table and create policies
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic employee policies if they exist
DROP POLICY IF EXISTS "Admins can do everything" ON public.employees;
DROP POLICY IF EXISTS "Managers can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Staff can view their own data" ON public.employees;

-- Create new employee policies using the security definer function
CREATE POLICY "Admins can manage all employees"
ON public.employees
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "Users can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert employees (for now, can be restricted later)
CREATE POLICY "Authenticated users can create employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (true);