
-- 1) Helper: get leave settings as JSONB with defaults
create or replace function public.get_leave_settings()
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  sv jsonb;
  out_json jsonb;
begin
  -- Load the most recent leave_settings entry; fallback to defaults if not present
  select setting_value
    into sv
  from system_settings
  where setting_key = 'leave_settings'
  order by updated_at desc nulls last, created_at desc
  limit 1;

  out_json := jsonb_build_object(
    'default_leave_days', coalesce((sv->>'default_leave_days')::int, 28),
    'fiscal_year_start_month', coalesce((sv->>'fiscal_year_start_month')::int, 4),
    'fiscal_year_start_day', coalesce((sv->>'fiscal_year_start_day')::int, 1),
    'enable_auto_reset', coalesce((sv->>'enable_auto_reset')::boolean, true),
    'last_auto_reset_at', case when (sv ? 'last_auto_reset_at')
                               then to_jsonb((sv->>'last_auto_reset_at')::timestamptz)
                               else to_jsonb(null::timestamptz)
                          end
  );

  return out_json;
end;
$$;

-- 2) Admin-only RPC: reset all active employees to default leave days
create or replace function public.reset_all_leave_balances()
returns integer
language plpgsql
security definer
set search_path to public
as $$
declare
  settings jsonb;
  default_days integer;
  updated_count integer;
begin
  -- Enforce admin
  if not public.is_admin_user() then
    raise exception 'Permission denied: admin role required';
  end if;

  settings := public.get_leave_settings();
  default_days := (settings->>'default_leave_days')::int;

  update employees
     set leave_taken = 0::numeric,
         remaining_leave_days = default_days::numeric,
         leave_allowance = default_days
   where coalesce(is_active, true) = true;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- 3) Automatic annual reset runner
create or replace function public.run_leave_annual_reset_if_needed()
returns text
language plpgsql
security definer
set search_path to public
as $$
declare
  settings jsonb;
  fy_month int;
  fy_day int;
  auto_enabled boolean;
  last_reset_at timestamptz;
  today date := current_date;
  this_year int := extract(year from today)::int;
  fy_start_this_year date;
  fy_start_year int;
  performed boolean := false;
  settings_row_id uuid;
  effective_settings jsonb;
  updated_settings jsonb;
begin
  settings := public.get_leave_settings();
  fy_month := (settings->>'fiscal_year_start_month')::int;
  fy_day   := (settings->>'fiscal_year_start_day')::int;
  auto_enabled := coalesce((settings->>'enable_auto_reset')::boolean, true);
  last_reset_at := nullif(settings->>'last_auto_reset_at','')::timestamptz;

  -- Determine the fiscal-year start date that corresponds to "current" period
  fy_start_this_year := make_date(this_year, fy_month, fy_day);

  -- If we are before this year's start date, the relevant fiscal start is last year
  if today < fy_start_this_year then
    fy_start_year := this_year - 1;
  else
    fy_start_year := this_year;
  end if;

  fy_start_this_year := make_date(fy_start_year, fy_month, fy_day);

  if auto_enabled then
    -- Only run if we haven't reset since the current fiscal period started
    if last_reset_at is null or (last_reset_at::date < fy_start_this_year) then
      perform public.reset_all_leave_balances();
      performed := true;

      -- Persist last_auto_reset_at into the latest leave_settings row if it exists,
      -- otherwise insert a new settings row with defaults + last_auto_reset_at.
      select id
        into settings_row_id
      from system_settings
      where setting_key = 'leave_settings'
      order by updated_at desc nulls last, created_at desc
      limit 1;

      if settings_row_id is not null then
        -- Merge current settings with updated last_auto_reset_at
        effective_settings := (select setting_value from system_settings where id = settings_row_id);
        updated_settings := jsonb_set(
          coalesce(effective_settings, '{}'::jsonb),
          '{last_auto_reset_at}',
          to_jsonb(now()::timestamptz),
          true
        );

        update system_settings
           set setting_value = updated_settings,
               updated_at = now()
         where id = settings_row_id;
      else
        -- Create a new leave_settings row if none exists
        insert into system_settings (setting_key, setting_value, description, created_at, updated_at)
        values (
          'leave_settings',
          jsonb_build_object(
            'default_leave_days', 28,
            'fiscal_year_start_month', fy_month,
            'fiscal_year_start_day', fy_day,
            'enable_auto_reset', true,
            'last_auto_reset_at', now()::timestamptz
          ),
          'Leave management settings',
          now(),
          now()
        );
      end if;
    end if;
  end if;

  return case when performed then 'reset_performed' else 'no_action' end;
end;
$$;

-- 4) Ensure pg_cron is available and schedule daily check at 03:00
create extension if not exists pg_cron with schema extensions;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'daily-leave-reset-check') then
    perform cron.schedule(
      'daily-leave-reset-check',
      '0 3 * * *',  -- daily at 03:00
      $$select public.run_leave_annual_reset_if_needed();$$
    );
  end if;
end;
$$;
