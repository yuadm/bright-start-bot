-- Create reference requests table to track sent reference requests
CREATE TABLE public.reference_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  reference_email TEXT NOT NULL,
  reference_name TEXT NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('employer', 'character')),
  reference_token UUID NOT NULL DEFAULT gen_random_uuid(),
  reference_data JSONB NOT NULL DEFAULT '{}', -- Store reference details like company, job title, etc.
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'completed', 'expired')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reference responses table to store completed reference forms
CREATE TABLE public.reference_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.reference_requests(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL DEFAULT '{}', -- Store the completed reference form data
  completed_by_name TEXT,
  completed_by_email TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reference_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for reference_requests
CREATE POLICY "Admins can manage reference requests" 
ON public.reference_requests 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view reference requests by token" 
ON public.reference_requests 
FOR SELECT 
USING (true);

-- Create policies for reference_responses  
CREATE POLICY "Admins can manage reference responses" 
ON public.reference_responses 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Public can insert reference responses" 
ON public.reference_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view reference responses by request" 
ON public.reference_responses 
FOR SELECT 
USING (true);

-- Create trigger for updating reference_requests updated_at
CREATE TRIGGER update_reference_requests_updated_at
BEFORE UPDATE ON public.reference_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_reference_requests_token ON public.reference_requests(reference_token);
CREATE INDEX idx_reference_requests_application ON public.reference_requests(application_id);
CREATE INDEX idx_reference_responses_request ON public.reference_responses(request_id);