-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Allow public read access to document tracker" ON public.document_tracker;
DROP POLICY IF EXISTS "Allow public insert access to document tracker" ON public.document_tracker;
DROP POLICY IF EXISTS "Allow public update access to document tracker" ON public.document_tracker;
DROP POLICY IF EXISTS "Allow public delete access to document tracker" ON public.document_tracker;

-- Recreate policies with simpler names and structure
CREATE POLICY "document_tracker_select_policy" ON public.document_tracker FOR SELECT USING (true);
CREATE POLICY "document_tracker_insert_policy" ON public.document_tracker FOR INSERT WITH CHECK (true);
CREATE POLICY "document_tracker_update_policy" ON public.document_tracker FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "document_tracker_delete_policy" ON public.document_tracker FOR DELETE USING (true);