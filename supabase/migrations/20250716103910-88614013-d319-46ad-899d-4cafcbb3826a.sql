-- Insert default company settings if none exist
INSERT INTO public.company_settings (name, tagline, address, phone, email)
SELECT 'Daryel Care', 'HR Management', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- Insert default leave settings if none exist
INSERT INTO public.leave_settings (default_leave_days, carry_over_enabled, manager_approval_required, max_carry_over_days)
SELECT 28, true, true, 5
WHERE NOT EXISTS (SELECT 1 FROM public.leave_settings);

-- Insert default document settings if none exist
INSERT INTO public.document_settings (expiry_threshold_days, email_notifications, auto_reminders, reminder_frequency)
SELECT 30, true, true, 'weekly'
WHERE NOT EXISTS (SELECT 1 FROM public.document_settings);

-- Insert default compliance settings if none exist
INSERT INTO public.compliance_settings (auto_generate_periods, reminder_days_before, email_notifications, archive_completed_records)
SELECT true, 7, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_settings);