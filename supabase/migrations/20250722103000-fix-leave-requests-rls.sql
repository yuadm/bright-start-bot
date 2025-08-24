-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Employees can view their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Employees can create leave requests" ON public.leave_requests;

-- Create simpler, working RLS policies for leave_requests
CREATE POLICY "Employees can view their own leave requests"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (
  employee_id::text = (auth.jwt() -> 'user_metadata' ->> 'employee_id')
);

CREATE POLICY "Employees can create their own leave requests"
ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
  employee_id::text = (auth.jwt() -> 'user_metadata' ->> 'employee_id')
);

CREATE POLICY "Employees can update their own leave requests"
ON public.leave_requests
FOR UPDATE
TO authenticated
USING (
  employee_id::text = (auth.jwt() -> 'user_metadata' ->> 'employee_id')
)
WITH CHECK (
  employee_id::text = (auth.jwt() -> 'user_metadata' ->> 'employee_id')
);