-- Add sponsored and 20_hours fields to employees table
ALTER TABLE public.employees 
ADD COLUMN sponsored boolean DEFAULT false,
ADD COLUMN twenty_hours boolean DEFAULT false;