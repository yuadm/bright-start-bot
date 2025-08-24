-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_info JSONB NOT NULL,
  availability JSONB,
  employment_history JSONB,
  skills_experience JSONB,
  declarations JSONB,
  consent JSONB,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for job_applications (allowing public insert for job applications)
CREATE POLICY "Anyone can submit job applications" ON public.job_applications
  FOR INSERT
  WITH CHECK (true);

-- Admin can view all applications
CREATE POLICY "Admins can view all job applications" ON public.job_applications
  FOR SELECT
  USING (is_admin_user());

-- Admin can update applications
CREATE POLICY "Admins can update job applications" ON public.job_applications
  FOR UPDATE
  USING (is_admin_user());

-- Add updated_at trigger
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();