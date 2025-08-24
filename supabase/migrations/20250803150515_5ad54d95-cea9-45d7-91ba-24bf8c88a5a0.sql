-- Add branch_id to compliance_questionnaires table
ALTER TABLE public.compliance_questionnaires 
ADD COLUMN branch_id UUID REFERENCES public.branches(id);

-- Update the unique constraint to include branch_id
-- First drop the existing constraint if it exists
ALTER TABLE public.compliance_questionnaires 
DROP CONSTRAINT IF EXISTS compliance_questionnaires_compliance_type_id_key;

-- Add new constraint for compliance_type_id + branch_id combination
ALTER TABLE public.compliance_questionnaires 
ADD CONSTRAINT compliance_questionnaires_type_branch_unique 
UNIQUE (compliance_type_id, branch_id);

-- Create index for better performance
CREATE INDEX idx_compliance_questionnaires_branch 
ON public.compliance_questionnaires(branch_id);

-- Update compliance_types table to add has_questionnaire flag
ALTER TABLE public.compliance_types 
ADD COLUMN has_questionnaire BOOLEAN DEFAULT false;