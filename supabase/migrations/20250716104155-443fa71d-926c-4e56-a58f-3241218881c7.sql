-- Update RLS policies for company_settings to allow authenticated users to manage settings
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON public.company_settings;

-- Create new policies that allow authenticated users to manage company settings
CREATE POLICY "Authenticated users can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage company settings" 
ON public.company_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Do the same for other settings tables
DROP POLICY IF EXISTS "Admins can manage leave settings" ON public.leave_settings;
DROP POLICY IF EXISTS "Authenticated users can view leave settings" ON public.leave_settings;

CREATE POLICY "Authenticated users can view leave settings" 
ON public.leave_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage leave settings" 
ON public.leave_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update document_settings policies
DROP POLICY IF EXISTS "Admins can manage document settings" ON public.document_settings;
DROP POLICY IF EXISTS "Authenticated users can view document settings" ON public.document_settings;

CREATE POLICY "Authenticated users can view document settings" 
ON public.document_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage document settings" 
ON public.document_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update compliance_settings policies
DROP POLICY IF EXISTS "Admins can manage compliance settings" ON public.compliance_settings;
DROP POLICY IF EXISTS "Authenticated users can view compliance settings" ON public.compliance_settings;

CREATE POLICY "Authenticated users can view compliance settings" 
ON public.compliance_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage compliance settings" 
ON public.compliance_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);