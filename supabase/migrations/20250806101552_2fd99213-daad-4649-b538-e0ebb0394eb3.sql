-- Allow anonymous users to upload signed documents
CREATE POLICY "Allow anonymous upload for signed documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-assets' 
  AND (storage.foldername(name))[1] = 'signed-documents'
);