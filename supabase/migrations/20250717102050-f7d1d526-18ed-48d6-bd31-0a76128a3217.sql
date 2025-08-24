-- Enable RLS policies for document_tracker table
CREATE POLICY "Allow public read access to document tracker" 
ON public.document_tracker 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to document tracker" 
ON public.document_tracker 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to document tracker" 
ON public.document_tracker 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public delete access to document tracker" 
ON public.document_tracker 
FOR DELETE 
USING (true);