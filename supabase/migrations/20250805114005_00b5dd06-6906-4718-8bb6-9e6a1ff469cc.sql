-- Add rejected_by column to leave_requests table
ALTER TABLE leave_requests 
ADD COLUMN rejected_by uuid REFERENCES auth.users(id);