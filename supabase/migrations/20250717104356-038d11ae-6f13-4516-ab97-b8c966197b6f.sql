-- Fix RLS policies for document_tracker table to allow authenticated users access
DROP POLICY IF EXISTS "document_tracker_select_policy" ON public.document_tracker;
DROP POLICY IF EXISTS "document_tracker_insert_policy" ON public.document_tracker;
DROP POLICY IF EXISTS "document_tracker_update_policy" ON public.document_tracker;
DROP POLICY IF EXISTS "document_tracker_delete_policy" ON public.document_tracker;

-- Create proper RLS policies for document_tracker
CREATE POLICY "Authenticated users can view document_tracker" 
ON public.document_tracker 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert document_tracker" 
ON public.document_tracker 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update document_tracker" 
ON public.document_tracker 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete document_tracker" 
ON public.document_tracker 
FOR DELETE 
USING (auth.uid() IS NOT NULL);