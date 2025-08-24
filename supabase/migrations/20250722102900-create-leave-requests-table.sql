-- Create leave_types table
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  max_days_per_year INTEGER DEFAULT 365,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  notes TEXT,
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Leave types policies - everyone can read, admins can manage
CREATE POLICY "Everyone can view leave types"
ON public.leave_types
FOR SELECT
TO authenticated, anon
USING (is_active = true);

CREATE POLICY "Admins can manage leave types"
ON public.leave_types
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Leave requests policies
CREATE POLICY "Employees can view their own leave requests"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM employees e 
    WHERE e.user_id = auth.uid()
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'employee_id' = e.id::text
  )
);

CREATE POLICY "Employees can create leave requests"
ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
  employee_id IN (
    SELECT e.id FROM employees e 
    WHERE e.user_id = auth.uid()
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'employee_id' = e.id::text
  )
);

CREATE POLICY "Admins can manage all leave requests"
ON public.leave_requests
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Create trigger for updating timestamps
CREATE TRIGGER update_leave_types_updated_at
BEFORE UPDATE ON public.leave_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default leave types
INSERT INTO public.leave_types (name, description, max_days_per_year, requires_approval) VALUES
('Annual Leave', 'Standard annual leave entitlement', 28, true),
('Sick Leave', 'Medical leave for illness', 10, false),
('Personal Leave', 'Personal time off', 5, true),
('Maternity/Paternity Leave', 'Leave for new parents', 365, true),
('Emergency Leave', 'Unexpected urgent situations', 3, false)
ON CONFLICT DO NOTHING;

-- Add function to calculate days requested
CREATE OR REPLACE FUNCTION calculate_leave_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days_requested = (NEW.end_date - NEW.start_date) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_leave_days_trigger
BEFORE INSERT OR UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION calculate_leave_days();