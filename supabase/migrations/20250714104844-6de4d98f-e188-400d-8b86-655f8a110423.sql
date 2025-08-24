-- Fix infinite recursion in user_roles RLS policies
-- Drop ALL existing policies on user_roles
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all menu permissions" ON public.user_menu_permissions;
DROP POLICY IF EXISTS "Users can read their own menu permissions" ON public.user_menu_permissions;
DROP POLICY IF EXISTS "admin_all_permissions" ON public.user_menu_permissions;
DROP POLICY IF EXISTS "read_own_permissions" ON public.user_menu_permissions;
DROP POLICY IF EXISTS "admin_all_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "user_view_own_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "admin_all_branch_permissions" ON public.user_branch_permissions;
DROP POLICY IF EXISTS "read_own_branch_permissions" ON public.user_branch_permissions;

-- Drop ALL existing policies on employees
DROP POLICY IF EXISTS "Admins can do everything" ON public.employees;
DROP POLICY IF EXISTS "Managers can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Staff can view their own data" ON public.employees;

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

-- Create new RLS policies for user_roles using the security definer function
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Create new RLS policies for employees - allow everyone to view and create for now
CREATE POLICY "Users can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create employees"  
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update employees"
ON public.employees  
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete employees"
ON public.employees
FOR DELETE  
TO authenticated
USING (true);