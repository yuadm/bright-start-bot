
-- First, let's update the user_permissions table to match the new structure
-- Drop the old table and recreate it with the correct schema
DROP TABLE IF EXISTS public.user_permissions CASCADE;

-- Create the new user_permissions table with the correct structure
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_type TEXT NOT NULL, -- 'page_access', 'feature_access'
  permission_key TEXT NOT NULL, -- '/employees', '/settings', 'can_delete', 'can_edit', etc.
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, permission_type, permission_key)
);

-- Create the user_branch_access table (might already exist from migration)
CREATE TABLE IF NOT EXISTS public.user_branch_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, branch_id)
);

-- Enable RLS on both tables
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branch_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions
DROP POLICY IF EXISTS "Admins can manage all user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;

CREATE POLICY "Admins can manage all user permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS policies for user_branch_access
DROP POLICY IF EXISTS "Admins can manage all branch access" ON public.user_branch_access;
DROP POLICY IF EXISTS "Users can view their own branch access" ON public.user_branch_access;

CREATE POLICY "Admins can manage all branch access"
ON public.user_branch_access
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own branch access"
ON public.user_branch_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create functions for checking permissions
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, perm_type TEXT, perm_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT granted FROM user_permissions 
     WHERE user_permissions.user_id = user_has_permission.user_id 
     AND permission_type = perm_type 
     AND permission_key = perm_key),
    true -- Default to true if no specific permission is set
  );
$$;

-- Create function to get user accessible branches
CREATE OR REPLACE FUNCTION get_user_accessible_branches(user_id UUID)
RETURNS TABLE(branch_id UUID)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- If user is admin, return all branches
  SELECT branches.id
  FROM branches
  WHERE EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = get_user_accessible_branches.user_id 
    AND role = 'admin'
  )
  
  UNION
  
  -- Otherwise return only branches they have access to
  SELECT uba.branch_id
  FROM user_branch_access uba
  WHERE uba.user_id = get_user_accessible_branches.user_id
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = get_user_accessible_branches.user_id 
    AND role = 'admin'
  );
$$;
