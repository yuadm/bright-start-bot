-- Create application personal information settings table
CREATE TABLE public.application_personal_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type text NOT NULL, -- 'title', 'borough', 'language', 'english_level', 'dbs_option', 'personal_care_option'
  value text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create application status settings table
CREATE TABLE public.application_status_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_name text NOT NULL UNIQUE,
  status_label text NOT NULL,
  status_color text NOT NULL DEFAULT '#64748b', -- Default slate color
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create application field configuration table
CREATE TABLE public.application_field_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_name text NOT NULL, -- 'personal_info', 'availability', 'employment_history', etc.
  field_name text NOT NULL,
  field_label text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  validation_rules jsonb DEFAULT '{}',
  help_text text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(step_name, field_name)
);

-- Enable RLS on all tables
ALTER TABLE public.application_personal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_field_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_personal_settings
CREATE POLICY "Admins can manage personal settings"
ON public.application_personal_settings
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view active personal settings"
ON public.application_personal_settings
FOR SELECT
TO public
USING (is_active = true);

-- RLS Policies for application_status_settings
CREATE POLICY "Admins can manage status settings"
ON public.application_status_settings
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Authenticated users can view status settings"
ON public.application_status_settings
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for application_field_settings
CREATE POLICY "Admins can manage field settings"
ON public.application_field_settings
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view visible field settings"
ON public.application_field_settings
FOR SELECT
TO public
USING (is_visible = true);

-- Create updated_at triggers
CREATE TRIGGER update_application_personal_settings_updated_at
  BEFORE UPDATE ON public.application_personal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_status_settings_updated_at
  BEFORE UPDATE ON public.application_status_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_field_settings_updated_at
  BEFORE UPDATE ON public.application_field_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default personal information settings
INSERT INTO public.application_personal_settings (setting_type, value, display_order) VALUES
-- Titles
('title', 'Mr', 1),
('title', 'Mrs', 2),
('title', 'Miss', 3),
('title', 'Ms', 4),
('title', 'Dr', 5),
('title', 'Prof', 6),

-- Boroughs
('borough', 'Westminster', 1),
('borough', 'Camden', 2),
('borough', 'Islington', 3),
('borough', 'Hackney', 4),
('borough', 'Tower Hamlets', 5),
('borough', 'Greenwich', 6),
('borough', 'Lewisham', 7),
('borough', 'Southwark', 8),
('borough', 'Lambeth', 9),
('borough', 'Wandsworth', 10),
('borough', 'Hammersmith and Fulham', 11),
('borough', 'Kensington and Chelsea', 12),
('borough', 'Other', 13),

-- Languages
('language', 'Spanish', 1),
('language', 'French', 2),
('language', 'German', 3),
('language', 'Italian', 4),
('language', 'Portuguese', 5),
('language', 'Arabic', 6),
('language', 'Mandarin', 7),
('language', 'Hindi', 8),
('language', 'Polish', 9),
('language', 'Romanian', 10),
('language', 'Other', 11),

-- English proficiency levels
('english_level', 'Native', 1),
('english_level', 'Fluent', 2),
('english_level', 'Intermediate', 3),
('english_level', 'Basic', 4),

-- DBS options
('dbs_option', 'Yes', 1),
('dbs_option', 'No', 2),
('dbs_option', 'Pending', 3),

-- Personal care options
('personal_care_option', 'Male', 1),
('personal_care_option', 'Female', 2),
('personal_care_option', 'Both', 3);

-- Insert default application status settings
INSERT INTO public.application_status_settings (status_name, status_label, status_color, is_default, display_order) VALUES
('new', 'New Application', '#10b981', true, 1),
('reviewing', 'Under Review', '#f59e0b', false, 2),
('interviewing', 'Interview Scheduled', '#3b82f6', false, 3),
('reference_check', 'Reference Check', '#8b5cf6', false, 4),
('approved', 'Approved', '#22c55e', false, 5),
('rejected', 'Rejected', '#ef4444', false, 6),
('withdrawn', 'Withdrawn', '#6b7280', false, 7),
('on_hold', 'On Hold', '#f97316', false, 8);

-- Insert default field settings for personal info step
INSERT INTO public.application_field_settings (step_name, field_name, field_label, is_required, display_order) VALUES
('personal_info', 'title', 'Title', true, 1),
('personal_info', 'fullName', 'Full Name', true, 2),
('personal_info', 'email', 'Email', true, 3),
('personal_info', 'confirmEmail', 'Confirm Email', true, 4),
('personal_info', 'telephone', 'Telephone/Mobile', true, 5),
('personal_info', 'dateOfBirth', 'Date of Birth', true, 6),
('personal_info', 'streetAddress', 'Street Address', true, 7),
('personal_info', 'streetAddress2', 'Street Address Second Line', false, 8),
('personal_info', 'town', 'Town', true, 9),
('personal_info', 'borough', 'Borough', true, 10),
('personal_info', 'postcode', 'Postcode', true, 11),
('personal_info', 'englishProficiency', 'Proficiency in English (if not first language)', true, 12),
('personal_info', 'positionAppliedFor', 'Position applied for', true, 13),
('personal_info', 'personalCareWillingness', 'Which personal care Are you willing to do?', true, 14),
('personal_info', 'hasDBS', 'Do you have a recent or updated DBS?', true, 15),
('personal_info', 'hasCarAndLicense', 'Do you currently have your own car and licence?', true, 16),
('personal_info', 'nationalInsuranceNumber', 'National Insurance Number', true, 17),
('personal_info', 'otherLanguages', 'Which other languages do you speak?', true, 18);