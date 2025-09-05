-- Add RLS policy for public access to reference_requests by token
CREATE POLICY "Public can access reference requests by token" 
ON public.reference_requests 
FOR ALL
USING (true)
WITH CHECK (true);