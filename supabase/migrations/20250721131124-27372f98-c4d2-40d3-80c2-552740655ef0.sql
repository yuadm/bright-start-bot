
-- Create employee_accounts table to manage employee login credentials
CREATE TABLE public.employee_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for employee_accounts
ALTER TABLE public.employee_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all employee accounts
CREATE POLICY "Admins can manage employee accounts" 
  ON public.employee_accounts 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Employees can view their own account info (for dashboard purposes)
CREATE POLICY "Employees can view own account" 
  ON public.employee_accounts 
  FOR SELECT 
  USING (employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ));

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_employee_accounts_updated_at
  BEFORE UPDATE ON public.employee_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate employee accounts with default passwords
CREATE OR REPLACE FUNCTION public.generate_employee_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  emp_record RECORD;
  emp_email TEXT;
  password_hash TEXT;
BEGIN
  -- Default password is '123456' - in production, this should be properly hashed
  password_hash := crypt('123456', gen_salt('bf'));
  
  FOR emp_record IN 
    SELECT id, name, email FROM employees 
    WHERE id NOT IN (SELECT employee_id FROM employee_accounts)
  LOOP
    -- Generate email from employee name if no email exists
    IF emp_record.email IS NULL OR emp_record.email = '' THEN
      emp_email := lower(replace(emp_record.name, ' ', '.')) || '@company.com';
    ELSE
      emp_email := emp_record.email;
    END IF;
    
    -- Insert employee account
    INSERT INTO employee_accounts (employee_id, email, password_hash)
    VALUES (emp_record.id, emp_email, password_hash)
    ON CONFLICT (email) DO NOTHING;
  END LOOP;
END;
$$;

-- Add pgcrypto extension for password hashing if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Generate accounts for existing employees
SELECT public.generate_employee_accounts();
