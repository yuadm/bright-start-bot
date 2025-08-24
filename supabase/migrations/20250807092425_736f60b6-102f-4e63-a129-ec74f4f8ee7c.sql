-- Phase 3: Application Step Settings and Dynamic Management

-- Create application step settings table
CREATE TABLE public.application_step_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  step_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create application emergency contact settings table
CREATE TABLE public.application_emergency_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type TEXT NOT NULL, -- 'relationship' or 'how_heard'
  value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create application reference settings table  
CREATE TABLE public.application_reference_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.application_step_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_emergency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_reference_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for application_step_settings
CREATE POLICY "Admins can manage step settings" 
ON public.application_step_settings 
FOR ALL 
USING (is_admin_user()) 
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view enabled step settings" 
ON public.application_step_settings 
FOR SELECT 
USING (is_enabled = true);

-- Create RLS policies for application_emergency_settings
CREATE POLICY "Admins can manage emergency settings" 
ON public.application_emergency_settings 
FOR ALL 
USING (is_admin_user()) 
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view active emergency settings" 
ON public.application_emergency_settings 
FOR SELECT 
USING (is_active = true);

-- Create RLS policies for application_reference_settings
CREATE POLICY "Admins can manage reference settings" 
ON public.application_reference_settings 
FOR ALL 
USING (is_admin_user()) 
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view reference settings" 
ON public.application_reference_settings 
FOR SELECT 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_application_step_settings_updated_at
BEFORE UPDATE ON public.application_step_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_emergency_settings_updated_at
BEFORE UPDATE ON public.application_emergency_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_reference_settings_updated_at
BEFORE UPDATE ON public.application_reference_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data for step settings
INSERT INTO public.application_step_settings (step_name, display_name, description, display_order) VALUES
  ('personal_info', 'Personal Information', 'Basic personal details and contact information', 1),
  ('availability', 'Availability', 'Work schedule preferences and right to work', 2),
  ('emergency_contact', 'Emergency Contact', 'Emergency contact details and how you heard about us', 3),
  ('employment_history', 'Employment History', 'Previous employment experience', 4),
  ('references', 'References', 'Professional or character references', 5),
  ('skills_experience', 'Skills & Experience', 'Skills assessment and experience levels', 6),
  ('declaration', 'Declaration', 'Legal declarations and safeguarding questions', 7),
  ('terms_policy', 'Terms & Policy', 'Consent and signature', 8);

-- Insert default data for emergency contact settings
INSERT INTO public.application_emergency_settings (setting_type, value, display_order) VALUES
  ('relationship', 'Parent', 1),
  ('relationship', 'Spouse', 2),
  ('relationship', 'Partner', 3),
  ('relationship', 'Sibling', 4),
  ('relationship', 'Friend', 5),
  ('relationship', 'Other Family Member', 6),
  ('relationship', 'Other', 7),
  ('how_heard', 'Job Website', 1),
  ('how_heard', 'Social Media', 2),
  ('how_heard', 'Friend/Family', 3),
  ('how_heard', 'Local Advertisement', 4),
  ('how_heard', 'Recruitment Agency', 5),
  ('how_heard', 'Walk-in', 6),
  ('how_heard', 'Other', 7);

-- Insert default reference settings
INSERT INTO public.application_reference_settings (setting_key, setting_value) VALUES
  ('references_config', '{
    "min_references": 2,
    "max_references": 2,
    "required_fields": ["name", "company", "jobTitle", "email", "address", "town", "contactNumber", "postcode"],
    "optional_fields": ["address2"],
    "employment_based_text": {
      "employed": {
        "title": "References",
        "description": "Please provide two professional references.",
        "reference_label": "Reference"
      },
      "unemployed": {
        "title": "References", 
        "description": "Please provide two character references.",
        "reference_label": "Character Reference"
      }
    }
  }'::jsonb);