
-- First, let's check if any data exists and clean up if needed
DELETE FROM public.compliance_types;

-- Insert the sample compliance types again
INSERT INTO public.compliance_types (name, description, frequency) VALUES 
('Safety Training', 'Mandatory safety training for all employees', 'annual'),
('Health Check', 'Regular health checkups', 'quarterly'),
('Security Clearance', 'Security clearance verification', 'bi-annual'),
('Skills Assessment', 'Employee skills evaluation', 'monthly'),
('Fire Safety Training', 'Fire safety procedures and evacuation', 'annual'),
('First Aid Certification', 'Basic first aid and CPR training', 'bi-annual');
