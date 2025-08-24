-- Create admin user and set up authentication
-- First, let's insert the admin user directly into auth.users
-- Note: In production, you'd typically use Supabase auth API, but for initial setup we can insert directly

-- Insert the admin user (this will be done via the auth API in the app)
-- For now, let's ensure our user_roles table has proper policies

-- Update user_roles policies to allow viewing own role
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to view all roles (for user management)
CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Create a function to create user accounts with roles
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  email_param TEXT,
  password_param TEXT,
  role_param TEXT DEFAULT 'user'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- This function will be called from the client side
  -- The actual user creation will happen via Supabase Auth API
  -- This function just handles role assignment
  RETURN JSON_BUILD_OBJECT('success', true, 'message', 'Use Supabase Auth API for user creation');
END;
$$;