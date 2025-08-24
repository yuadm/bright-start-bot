-- First drop the existing foreign key constraint if it exists
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_branch_id_fkey;

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE employees 
ADD CONSTRAINT employees_branch_id_fkey 
FOREIGN KEY (branch_id) 
REFERENCES branches(id) 
ON DELETE CASCADE;