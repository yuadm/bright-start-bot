-- Enable cascading deletes so templates can be removed even when referenced
BEGIN;

-- 1) signing_requests.template_id -> document_templates.id (ON DELETE CASCADE)
ALTER TABLE public.signing_requests
  DROP CONSTRAINT IF EXISTS signing_requests_template_id_fkey;
ALTER TABLE public.signing_requests
  ADD CONSTRAINT signing_requests_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.document_templates(id)
  ON DELETE CASCADE;

-- 2) signing_request_recipients.signing_request_id -> signing_requests.id (ON DELETE CASCADE)
ALTER TABLE public.signing_request_recipients
  DROP CONSTRAINT IF EXISTS signing_request_recipients_signing_request_id_fkey;
ALTER TABLE public.signing_request_recipients
  ADD CONSTRAINT signing_request_recipients_signing_request_id_fkey
  FOREIGN KEY (signing_request_id)
  REFERENCES public.signing_requests(id)
  ON DELETE CASCADE;

-- 3) signed_documents.signing_request_id -> signing_requests.id (ON DELETE CASCADE)
ALTER TABLE public.signed_documents
  DROP CONSTRAINT IF EXISTS signed_documents_signing_request_id_fkey;
ALTER TABLE public.signed_documents
  ADD CONSTRAINT signed_documents_signing_request_id_fkey
  FOREIGN KEY (signing_request_id)
  REFERENCES public.signing_requests(id)
  ON DELETE CASCADE;

-- 4) template_fields.template_id -> document_templates.id (ON DELETE CASCADE)
ALTER TABLE public.template_fields
  DROP CONSTRAINT IF EXISTS template_fields_template_id_fkey;
ALTER TABLE public.template_fields
  ADD CONSTRAINT template_fields_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.document_templates(id)
  ON DELETE CASCADE;

COMMIT;