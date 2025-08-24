-- Create application shift settings table
CREATE TABLE public.application_shift_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application skills categories table
CREATE TABLE public.application_skills_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application skills table
CREATE TABLE public.application_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.application_skills_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_shift_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_skills_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_skills ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage shift settings" ON public.application_shift_settings FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Public can view active shift settings" ON public.application_shift_settings FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage skills categories" ON public.application_skills_categories FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Public can view active skills categories" ON public.application_skills_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage skills" ON public.application_skills FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Public can view active skills" ON public.application_skills FOR SELECT USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_application_shift_settings_updated_at
  BEFORE UPDATE ON public.application_shift_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_skills_categories_updated_at
  BEFORE UPDATE ON public.application_skills_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_skills_updated_at
  BEFORE UPDATE ON public.application_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shift patterns
INSERT INTO public.application_shift_settings (name, label, start_time, end_time, display_order) VALUES
('day_shift', 'Day shift (8am-5pm)', '08:00', '17:00', 1),
('morning_shift', 'Morning shift (7am-3pm)', '07:00', '15:00', 2),
('evening_shift', 'Evening shift (2pm-10pm)', '14:00', '22:00', 3),
('night_shift', 'Night shift (9pm-7am)', '21:00', '07:00', 4),
('sleep_in', 'Sleep in (9pm-8am)', '21:00', '08:00', 5),
('weekend_shift', 'Weekend shift (8am-8pm)', '08:00', '20:00', 6),
('on_call', 'On call', '00:00', '23:59', 7);

-- Insert default skills categories
INSERT INTO public.application_skills_categories (name, description, display_order) VALUES
('Medical Conditions', 'Experience with various medical conditions and diagnoses', 1),
('Physical Care', 'Physical assistance and mobility support', 2),
('Specialized Care', 'Specialized medical and nursing procedures', 3),
('Behavioral Support', 'Managing challenging behaviors and mental health', 4),
('Age-Specific Care', 'Care for specific age groups and demographics', 5);

-- Insert default skills
INSERT INTO public.application_skills (category_id, name, display_order) VALUES
-- Medical Conditions
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'ADHD', 1),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Alzheimers', 2),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Autism', 3),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Cancer care', 4),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Cerebral Palsy', 5),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Dementia care', 6),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Diabetes', 7),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Down'' syndrome', 8),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Learning disabilities', 9),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Lewy-Body dementia', 10),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Multiple sclerosis', 11),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Parkinson''s disease', 12),
((SELECT id FROM public.application_skills_categories WHERE name = 'Medical Conditions'), 'Stroke care', 13),

-- Physical Care
((SELECT id FROM public.application_skills_categories WHERE name = 'Physical Care'), 'Assisting with immobility', 1),
((SELECT id FROM public.application_skills_categories WHERE name = 'Physical Care'), 'Hoists', 2),
((SELECT id FROM public.application_skills_categories WHERE name = 'Physical Care'), 'Incontinence', 3),

-- Specialized Care
((SELECT id FROM public.application_skills_categories WHERE name = 'Specialized Care'), 'Administration of medicine', 1),
((SELECT id FROM public.application_skills_categories WHERE name = 'Specialized Care'), 'Catheter care', 2),
((SELECT id FROM public.application_skills_categories WHERE name = 'Specialized Care'), 'Tube feeding', 3),
((SELECT id FROM public.application_skills_categories WHERE name = 'Specialized Care'), 'Terminally III', 4),

-- Behavioral Support
((SELECT id FROM public.application_skills_categories WHERE name = 'Behavioral Support'), 'Challenging behaviour', 1),
((SELECT id FROM public.application_skills_categories WHERE name = 'Behavioral Support'), 'Mental health', 2),

-- Age-Specific Care
((SELECT id FROM public.application_skills_categories WHERE name = 'Age-Specific Care'), 'Frail elderly', 1),
((SELECT id FROM public.application_skills_categories WHERE name = 'Age-Specific Care'), 'Special need children', 2);