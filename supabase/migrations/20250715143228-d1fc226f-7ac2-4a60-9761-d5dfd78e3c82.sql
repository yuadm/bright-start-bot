-- Create settings tables for company, leave, documents, compliance, and branches

-- System settings table for general configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  setting_key VARCHAR NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT
);

-- Company settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  tagline TEXT,
  address TEXT,
  phone TEXT,
  email TEXT
);

-- Leave settings table
CREATE TABLE public.leave_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  default_leave_days INTEGER NOT NULL DEFAULT 28,
  carry_over_enabled BOOLEAN NOT NULL DEFAULT true,
  manager_approval_required BOOLEAN NOT NULL DEFAULT true,
  max_carry_over_days INTEGER DEFAULT 5
);

-- Document settings table
CREATE TABLE public.document_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_threshold_days INTEGER NOT NULL DEFAULT 30,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_reminders BOOLEAN NOT NULL DEFAULT true,
  reminder_frequency VARCHAR NOT NULL DEFAULT 'weekly'
);

-- Compliance settings table
CREATE TABLE public.compliance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  auto_generate_periods BOOLEAN NOT NULL DEFAULT true,
  reminder_days_before INTEGER NOT NULL DEFAULT 7,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  archive_completed_records BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on all settings tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can manage company settings"
ON public.company_settings
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can manage leave settings"
ON public.leave_settings
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can manage document settings"
ON public.document_settings
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can manage compliance settings"
ON public.compliance_settings
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Allow authenticated users to view settings
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view leave settings"
ON public.leave_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view document settings"
ON public.document_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view compliance settings"
ON public.compliance_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_settings_updated_at
BEFORE UPDATE ON public.leave_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_settings_updated_at
BEFORE UPDATE ON public.document_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_settings_updated_at
BEFORE UPDATE ON public.compliance_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.company_settings (name, tagline, address, phone, email)
VALUES ('Daryel Care', 'HR Management', '', '', '');

INSERT INTO public.leave_settings (default_leave_days, carry_over_enabled, manager_approval_required)
VALUES (28, true, true);

INSERT INTO public.document_settings (expiry_threshold_days, email_notifications, auto_reminders)
VALUES (30, true, true);

INSERT INTO public.compliance_settings (auto_generate_periods, reminder_days_before, email_notifications)
VALUES (true, 7, true);