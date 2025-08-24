-- Add missing columns to leave_requests table for approval workflow
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS manager_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS days_requested INTEGER;

-- Add trigger to calculate days_requested automatically
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