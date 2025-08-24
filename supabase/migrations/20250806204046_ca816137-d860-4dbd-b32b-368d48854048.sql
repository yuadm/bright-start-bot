-- Update employees with missing branch_id by matching branch names
UPDATE employees 
SET branch_id = b.id
FROM branches b
WHERE employees.branch = b.name
AND employees.branch_id IS NULL;