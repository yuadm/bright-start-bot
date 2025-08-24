-- Create a function to automatically set branch_id based on branch name
CREATE OR REPLACE FUNCTION public.sync_employee_branch_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If branch_id is not set but branch name is provided, find and set the branch_id
  IF NEW.branch_id IS NULL AND NEW.branch IS NOT NULL THEN
    SELECT id INTO NEW.branch_id 
    FROM branches 
    WHERE name = NEW.branch;
  END IF;
  
  -- If branch_id is set but branch name is not, set the branch name
  IF NEW.branch_id IS NOT NULL AND (NEW.branch IS NULL OR NEW.branch = '') THEN
    SELECT name INTO NEW.branch 
    FROM branches 
    WHERE id = NEW.branch_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync branch_id and branch name
CREATE TRIGGER sync_employee_branch_trigger
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_branch_id();