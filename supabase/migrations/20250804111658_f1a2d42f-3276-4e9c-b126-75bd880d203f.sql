-- Allow public access to insert signed documents (for recipients signing documents)
CREATE POLICY "Public can create signed documents" 
ON public.signed_documents 
FOR INSERT 
WITH CHECK (true);