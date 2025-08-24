-- Add cascade delete for document_tracker when branch is deleted
-- First, let's see if we can drop the existing constraint and recreate it with CASCADE

-- Drop the existing foreign key constraint
ALTER TABLE document_tracker DROP CONSTRAINT IF EXISTS document_tracker_branch_id_fkey;

-- Recreate the constraint with CASCADE DELETE
-- This will automatically delete document_tracker records when a branch is deleted
ALTER TABLE document_tracker 
ADD CONSTRAINT document_tracker_branch_id_fkey 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;