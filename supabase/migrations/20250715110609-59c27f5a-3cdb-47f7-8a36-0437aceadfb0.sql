
-- Create a table for compliance types (different from compliance_tasks)
CREATE TABLE IF NOT EXISTS public.compliance_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for compliance types
ALTER TABLE public.compliance_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view compliance types
CREATE POLICY "Allow authenticated users to view compliance types" 
ON public.compliance_types 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins to manage compliance types
CREATE POLICY "Admins can manage compliance types" 
ON public.compliance_types 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Insert some sample compliance types
INSERT INTO public.compliance_types (name, description, frequency) VALUES 
('Safety Training', 'Mandatory safety training for all employees', 'Annual'),
('Health Check', 'Regular health checkups', 'Quarterly'),
('Security Clearance', 'Security clearance verification', 'Bi-Annual'),
('Skills Assessment', 'Employee skills evaluation', 'Monthly');
