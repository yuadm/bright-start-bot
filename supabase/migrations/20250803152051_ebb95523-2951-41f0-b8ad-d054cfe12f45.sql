-- Remove the existing foreign key constraint for approved_by
ALTER TABLE public.leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_approved_by_fkey;

-- The approved_by field will now store user IDs from auth.users without foreign key constraint
-- This allows us to track who approved/rejected the leave request