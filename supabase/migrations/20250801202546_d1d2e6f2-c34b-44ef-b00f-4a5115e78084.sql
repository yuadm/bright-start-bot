-- Create document signing system tables

-- 1. Document templates table
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Template fields table
CREATE TABLE public.template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'date', 'signature', 'checkbox')),
  x_position NUMERIC NOT NULL,
  y_position NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  placeholder_text TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Signing requests table
CREATE TABLE public.signing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.document_templates(id),
  title TEXT NOT NULL,
  message TEXT,
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'completed', 'cancelled')),
  signing_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Signing request recipients table
CREATE TABLE public.signing_request_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signing_request_id UUID NOT NULL REFERENCES public.signing_requests(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  signing_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  signed_at TIMESTAMP WITH TIME ZONE,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Signed documents table
CREATE TABLE public.signed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signing_request_id UUID NOT NULL REFERENCES public.signing_requests(id),
  final_document_path TEXT NOT NULL,
  completion_data JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_request_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_templates
CREATE POLICY "Admins can manage document templates" 
ON public.document_templates 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Authenticated users can view document templates" 
ON public.document_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for template_fields
CREATE POLICY "Admins can manage template fields" 
ON public.template_fields 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Authenticated users can view template fields" 
ON public.template_fields 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for signing_requests
CREATE POLICY "Admins can manage signing requests" 
ON public.signing_requests 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Users can view their own signing requests" 
ON public.signing_requests 
FOR SELECT 
USING (created_by = auth.uid());

-- Create RLS policies for signing_request_recipients
CREATE POLICY "Admins can manage signing request recipients" 
ON public.signing_request_recipients 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view with valid access token" 
ON public.signing_request_recipients 
FOR SELECT 
USING (true);

-- Create RLS policies for signed_documents
CREATE POLICY "Admins can manage signed documents" 
ON public.signed_documents 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Authenticated users can view signed documents" 
ON public.signed_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_template_fields_template_id ON public.template_fields(template_id);
CREATE INDEX idx_signing_request_recipients_signing_request_id ON public.signing_request_recipients(signing_request_id);
CREATE INDEX idx_signing_request_recipients_access_token ON public.signing_request_recipients(access_token);
CREATE INDEX idx_signing_requests_signing_token ON public.signing_requests(signing_token);
CREATE INDEX idx_signed_documents_signing_request_id ON public.signed_documents(signing_request_id);

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signing_requests_updated_at
  BEFORE UPDATE ON public.signing_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();