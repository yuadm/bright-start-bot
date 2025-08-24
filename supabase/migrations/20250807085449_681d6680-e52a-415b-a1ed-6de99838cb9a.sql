-- Fix the security issue by setting the search path for the function
CREATE OR REPLACE FUNCTION public.sync_employee_branch_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;