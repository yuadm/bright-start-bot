
-- First, let's add some default document types
INSERT INTO document_types (name) VALUES 
('Passport'),
('Visa'),
('Work Permit'),
('Driving License'),
('National ID'),
('Birth Certificate'),
('Marriage Certificate'),
('Insurance Certificate'),
('Contract'),
('Other')
ON CONFLICT DO NOTHING;

-- Add a policy to allow read access to document types for everyone
-- since this is reference data that should be accessible
CREATE POLICY "Allow read access to document types" 
ON document_types 
FOR SELECT 
USING (true);
