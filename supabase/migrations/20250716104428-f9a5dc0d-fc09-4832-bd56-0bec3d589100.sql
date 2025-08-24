
-- Update RLS policies for company_settings to allow public access
-- This will fix the 401 Unauthorized error when saving company settings

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Authenticated users can manage company settings" ON public.company_settings;

-- Create new policies that allow public access
CREATE POLICY "Allow public read access to company settings" 
ON public.company_settings 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to company settings" 
ON public.company_settings 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to company settings" 
ON public.company_settings 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access to company settings" 
ON public.company_settings 
FOR DELETE 
TO anon, authenticated
USING (true);

-- Also update other settings tables to allow public access
-- Leave Settings
DROP POLICY IF EXISTS "Authenticated users can view leave settings" ON public.leave_settings;
DROP POLICY IF EXISTS "Authenticated users can manage leave settings" ON public.leave_settings;

CREATE POLICY "Allow public access to leave settings" 
ON public.leave_settings 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Document Settings  
DROP POLICY IF EXISTS "Authenticated users can view document settings" ON public.document_settings;
DROP POLICY IF EXISTS "Authenticated users can manage document settings" ON public.document_settings;

CREATE POLICY "Allow public access to document settings" 
ON public.document_settings 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Compliance Settings
DROP POLICY IF EXISTS "Authenticated users can view compliance settings" ON public.compliance_settings;
DROP POLICY IF EXISTS "Authenticated users can manage compliance settings" ON public.compliance_settings;

CREATE POLICY "Allow public access to compliance settings" 
ON public.compliance_settings 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);
