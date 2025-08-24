-- Update document_tracker table to allow text values in date fields
ALTER TABLE public.document_tracker 
ALTER COLUMN expiry_date TYPE TEXT,
ALTER COLUMN issue_date TYPE TEXT;