
-- Ensure required extensions exist
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1) Schedule weekly archival (Sundays 02:00 UTC)
-- Remove existing job with the same name if any, then create it
select cron.unschedule('compliance-data-archival-weekly') where exists (
  select 1 from cron.job where jobname = 'compliance-data-archival-weekly'
);

select
  cron.schedule(
    'compliance-data-archival-weekly',
    '0 2 * * 0',  -- Sundays at 02:00 UTC
    $$
    select
      net.http_post(
          url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-data-archival',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
          body:='{"forceArchival": false}'::jsonb
      ) as request_id;
    $$
  );

-- 2) Attach missing triggers

-- document_tracker: recalculate status on insert/update of expiry_date
drop trigger if exists trg_update_document_status on public.document_tracker;
create trigger trg_update_document_status
before insert or update of expiry_date on public.document_tracker
for each row execute function public.update_document_status();

-- signing_request_recipients: expire link immediately if accessed after signed
drop trigger if exists trg_expire_signed_link_on_access on public.signing_request_recipients;
create trigger trg_expire_signed_link_on_access
before update of access_count on public.signing_request_recipients
for each row execute function public.expire_signed_link_on_access();

-- leave_requests: auto-calculate days_requested from start_date/end_date
drop trigger if exists trg_calculate_leave_days on public.leave_requests;
create trigger trg_calculate_leave_days
before insert or update of start_date, end_date on public.leave_requests
for each row execute function public.calculate_leave_days();

-- employees: keep branch and branch_id in sync
drop trigger if exists trg_sync_employee_branch_id on public.employees;
create trigger trg_sync_employee_branch_id
before insert or update of branch, branch_id on public.employees
for each row execute function public.sync_employee_branch_id();

-- compliance_automation_settings: maintain updated_at
drop trigger if exists trg_compliance_automation_settings_updated_at on public.compliance_automation_settings;
create trigger trg_compliance_automation_settings_updated_at
before update on public.compliance_automation_settings
for each row execute function public.update_compliance_automation_settings_updated_at();
