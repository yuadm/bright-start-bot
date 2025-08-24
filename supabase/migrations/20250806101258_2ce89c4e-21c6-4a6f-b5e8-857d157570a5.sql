-- Fix the RLS policy to properly allow access for signing requests
-- The current policy might have issues, let's recreate it more explicitly

DROP POLICY IF EXISTS "Public can view template fields via signing requests" ON public.template_fields;

CREATE POLICY "Public can view template fields via signing requests" 
ON public.template_fields 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM signing_requests sr 
    WHERE sr.template_id = template_fields.template_id 
    AND sr.signing_token IS NOT NULL
  )
);