-- Temporarily allow anonymous access to employees table for testing
-- We'll implement proper authentication later

-- Drop current authenticated-only policies
DROP POLICY IF EXISTS "Users can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can create employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees" ON public.employees;

-- Create policies that allow anonymous access for now
CREATE POLICY "Allow anonymous read access to employees"
ON public.employees
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous insert access to employees"
ON public.employees
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to employees"
ON public.employees
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to employees"
ON public.employees
FOR DELETE
TO anon, authenticated
USING (true);