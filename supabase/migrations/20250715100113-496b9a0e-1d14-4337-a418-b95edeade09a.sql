-- Make branch_id nullable in document_tracker table since branch selection is now optional
ALTER TABLE document_tracker 
ALTER COLUMN branch_id DROP NOT NULL;