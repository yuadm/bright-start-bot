
-- Remove the admin-only RLS policy from leave_types table
DROP POLICY IF EXISTS "Admins can do everything" ON public.leave_types;

-- Create new policies that allow all authenticated users to access leave types
CREATE POLICY "All users can view leave types" 
ON public.leave_types 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert leave types (you can restrict this later if needed)
CREATE POLICY "Authenticated users can create leave types" 
ON public.leave_types 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update leave types (you can restrict this later if needed)
CREATE POLICY "Authenticated users can update leave types" 
ON public.leave_types 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete leave types (you can restrict this later if needed)
CREATE POLICY "Authenticated users can delete leave types" 
ON public.leave_types 
FOR DELETE 
TO authenticated 
USING (true);
