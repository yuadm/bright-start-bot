
-- Fix RLS policies for branches table to allow proper access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.branches;
DROP POLICY IF EXISTS "Authenticated users can manage branches" ON public.branches;

-- Create more permissive policies for development
-- Allow public read access to branches
CREATE POLICY "Allow public read access to branches" 
ON public.branches 
FOR SELECT 
USING (true);

-- Allow public insert access to branches
CREATE POLICY "Allow public insert access to branches" 
ON public.branches 
FOR INSERT 
WITH CHECK (true);

-- Allow public update access to branches
CREATE POLICY "Allow public update access to branches" 
ON public.branches 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow public delete access to branches
CREATE POLICY "Allow public delete access to branches" 
ON public.branches 
FOR DELETE 
USING (true);

-- Grant necessary permissions to anon and authenticated roles
GRANT ALL ON public.branches TO anon;
GRANT ALL ON public.branches TO authenticated;
