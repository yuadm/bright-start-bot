-- Check existing foreign key constraints on employees table
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table_name,
    a.attname AS column_name,
    af.attname AS foreign_column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
WHERE c.contype = 'f' 
AND c.conrelid = 'employees'::regclass
AND af.attname = 'id'
AND a.attname LIKE '%branch%';

-- Drop the existing constraint with the correct name
ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_branch_id;

-- Re-add it with CASCADE delete
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_branch_id 
FOREIGN KEY (branch_id) 
REFERENCES branches(id) 
ON DELETE CASCADE;