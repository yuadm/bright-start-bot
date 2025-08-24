-- Drop both foreign key constraints
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_branch_id_fkey;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_branch_id;

-- Add a single CASCADE constraint
ALTER TABLE employees 
ADD CONSTRAINT employees_branch_id_fkey 
FOREIGN KEY (branch_id) 
REFERENCES branches(id) 
ON DELETE CASCADE;