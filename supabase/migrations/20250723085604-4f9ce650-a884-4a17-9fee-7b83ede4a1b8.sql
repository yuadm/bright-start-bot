-- Fix the status constraint to allow 'rejected' instead of 'denied'
ALTER TABLE public.leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_status_check;

ALTER TABLE public.leave_requests 
ADD CONSTRAINT leave_requests_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));