
-- Insert some default leave types if they don't exist
INSERT INTO leave_types (name, reduces_allowance) VALUES 
('Annual Leave', true),
('Sick Leave', false),
('Personal Leave', true),
('Emergency Leave', false),
('Maternity Leave', false),
('Paternity Leave', false)
ON CONFLICT DO NOTHING;

-- Insert some default branches if they don't exist
INSERT INTO branches (name) VALUES 
('Main Office'),
('Branch A'),
('Branch B'),
('Remote')
ON CONFLICT DO NOTHING;
