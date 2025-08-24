-- Create RLS policy to allow public read access to template_fields for document signing
CREATE POLICY "Allow public read access to template_fields" 
ON public.template_fields 
FOR SELECT 
USING (true);