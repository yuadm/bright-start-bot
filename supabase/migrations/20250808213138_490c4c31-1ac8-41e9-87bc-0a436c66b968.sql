
-- 1) Ensure required extensions for scheduling/invoking edge functions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Create the missing compliance_automation_settings table
create table if not exists public.compliance_automation_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Controls auto record generation used by generate_compliance_records_for_period()
  auto_generate_records boolean not null default true,
  grace_period_days integer not null default 7,
  -- Controls archival behavior checked by the archival edge function
  auto_archive_completed boolean not null default false,
  -- Optional reminder settings for UI
  send_reminders boolean not null default true,
  reminder_days_before integer not null default 7,
  -- Operational metadata
  last_automation_run timestamptz,
  last_archival_run timestamptz
);

-- RLS and policies
alter table public.compliance_automation_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'compliance_automation_settings' and policyname = 'Admins can manage automation settings'
  ) then
    create policy "Admins can manage automation settings"
      on public.compliance_automation_settings
      for all
      using (is_admin_user())
      with check (is_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'compliance_automation_settings' and policyname = 'Authenticated users can view automation settings'
  ) then
    create policy "Authenticated users can view automation settings"
      on public.compliance_automation_settings
      for select
      using (auth.uid() is not null);
  end if;
end
$$;

-- Keep updated_at current
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_compliance_automation_settings_updated_at'
  ) then
    create trigger trg_compliance_automation_settings_updated_at
    before update on public.compliance_automation_settings
    for each row
    execute function public.update_compliance_automation_settings_updated_at();
  end if;
end
$$;

-- Seed a default row if none exists (prevents null-record errors in functions)
insert into public.compliance_automation_settings (
  auto_generate_records, grace_period_days, auto_archive_completed, send_reminders, reminder_days_before
)
select true, 7, false, true, 7
where not exists (select 1 from public.compliance_automation_settings);

-- 3) Add an overload to fix calculate_archive_dates RPC mismatch
-- Existing function signature is (frequency text, base_year integer default ...)
-- This overload accepts just base_year and returns the same output shape.
create or replace function public.calculate_archive_dates(base_year integer default (extract(year from current_date))::integer)
returns table(archive_due_date date, download_available_date date)
language plpgsql
as $function$
declare
  retention_years integer;
  archive_date date;
begin
  retention_years := 6;
  archive_date := ((base_year + retention_years + 1)::text || '-01-01')::date;
  return query
  select
    archive_date as archive_due_date,
    (archive_date - interval '3 months')::date as download_available_date;
end;
$function$;

-- 4) Attach useful triggers that were defined but not in use

-- document_tracker -> update status based on expiry_date
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_document_tracker_update_status') then
    create trigger trg_document_tracker_update_status
    before insert or update on public.document_tracker
    for each row
    execute function public.update_document_status();
  end if;
end
$$;

-- signing_request_recipients -> expire link when access_count increases after signed
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_recipient_expire_on_access') then
    create trigger trg_recipient_expire_on_access
    before update of access_count on public.signing_request_recipients
    for each row
    execute function public.expire_signed_link_on_access();
  end if;
end
$$;

-- leave_requests -> auto-calculate days_requested
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_leave_requests_calc_days') then
    create trigger trg_leave_requests_calc_days
    before insert or update on public.leave_requests
    for each row
    execute function public.calculate_leave_days();
  end if;
end
$$;

-- employees -> keep branch and branch_id in sync
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_employees_sync_branch') then
    create trigger trg_employees_sync_branch
    before insert or update on public.employees
    for each row
    execute function public.sync_employee_branch_id();
  end if;
end
$$;

-- 5) Schedule edge functions via pg_cron + pg_net
-- Clean up any previous jobs to avoid duplicates
do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-compliance-automation') then
    perform cron.unschedule('daily-compliance-automation');
  end if;
  if exists (select 1 from cron.job where jobname = 'weekly-compliance-archival') then
    perform cron.unschedule('weekly-compliance-archival');
  end if;
end
$$;

-- Daily compliance automation at 01:15 UTC
select
  cron.schedule(
    'daily-compliance-automation',
    '15 1 * * *',
    $$
    select
      net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:='{}'::jsonb
      );
    $$
  );

-- Weekly archival on Sundays at 02:00 UTC
select
  cron.schedule(
    'weekly-compliance-archival',
    '0 2 * * 0',
    $$
    select
      net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-data-archival',
        headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:='{}'::jsonb
      );
    $$
  );
