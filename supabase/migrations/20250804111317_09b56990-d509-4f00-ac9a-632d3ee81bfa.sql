-- Allow public access to signing requests by signing token
CREATE POLICY "Public can view signing requests by token" 
ON public.signing_requests 
FOR SELECT 
USING (signing_token IS NOT NULL);

-- Also ensure public access to related document templates when accessed via signing token
CREATE POLICY "Public can view document templates via signing requests" 
ON public.document_templates 
FOR SELECT 
USING (id IN (
  SELECT template_id 
  FROM signing_requests 
  WHERE signing_token IS NOT NULL
));