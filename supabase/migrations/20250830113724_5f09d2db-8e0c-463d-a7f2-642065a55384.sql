-- Create Client Spot-Check compliance type with proper primary key
INSERT INTO client_compliance_types (id, name, description, frequency, has_questionnaire) 
VALUES (gen_random_uuid(), 'Client Spot-Check', 'Service Quality Spot Check for client care assessment', 'quarterly', true);