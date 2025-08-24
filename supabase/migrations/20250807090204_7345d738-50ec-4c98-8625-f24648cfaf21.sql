-- Fix the leave_requests RLS policies to allow proper access for authenticated users

-- First, drop the conflicting policies
DROP POLICY IF EXISTS "Employees can create their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can update their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Staff can create their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Staff can view their own leave requests" ON leave_requests;

-- Create cleaner, more straightforward policies
-- Policy for users to create leave requests for employees they are linked to
CREATE POLICY "Users can create leave requests for their employee record" 
ON leave_requests 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = leave_requests.employee_id 
    AND employees.user_id = auth.uid()
  )
);

-- Policy for users to view their own leave requests
CREATE POLICY "Users can view their own leave requests" 
ON leave_requests 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = leave_requests.employee_id 
    AND employees.user_id = auth.uid()
  )
);

-- Policy for users to update their own pending leave requests
CREATE POLICY "Users can update their own pending leave requests" 
ON leave_requests 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = leave_requests.employee_id 
    AND employees.user_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = leave_requests.employee_id 
    AND employees.user_id = auth.uid()
  )
);

-- Ensure managers can approve/reject leave requests
CREATE POLICY "Managers can manage all leave requests" 
ON leave_requests 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'manager')
  )
);