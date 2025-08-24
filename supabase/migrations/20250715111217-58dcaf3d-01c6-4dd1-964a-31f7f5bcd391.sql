
-- First, let's disable RLS temporarily to test
ALTER TABLE public.compliance_types DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.compliance_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view compliance types" ON public.compliance_types;
DROP POLICY IF EXISTS "Admins can manage compliance types" ON public.compliance_types;

-- Create a simple policy that allows all authenticated users to view compliance types
CREATE POLICY "Allow all authenticated users to view compliance types" 
ON public.compliance_types 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow public access for now (since we might not have authentication set up)
CREATE POLICY "Allow public read access to compliance types" 
ON public.compliance_types 
FOR SELECT 
TO anon 
USING (true);

-- Create policy for admins to manage compliance types (if user_roles table exists)
CREATE POLICY "Admins can manage compliance types" 
ON public.compliance_types 
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
