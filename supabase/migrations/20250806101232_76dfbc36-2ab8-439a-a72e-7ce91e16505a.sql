-- Remove the overly permissive policy and check why the existing signing request policy isn't working
DROP POLICY "Allow public read access to template_fields" ON public.template_fields;

-- Check if the signing request query condition is working
-- The existing policy should allow access when: template_id IN (SELECT sr.template_id FROM signing_requests sr WHERE sr.signing_token IS NOT NULL)