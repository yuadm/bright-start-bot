-- Set up cron jobs for compliance automation

-- Daily status updates (runs every day at 2 AM)
SELECT cron.schedule(
  'compliance-daily-status-update',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:='{"action": "daily_update"}'::jsonb
    ) as request_id;
  $$
);

-- Quarterly period generation (1st day of each quarter at 1 AM)
SELECT cron.schedule(
  'compliance-quarterly-generation',
  '0 1 1 1,4,7,10 *',
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:='{"action": "quarterly_generation"}'::jsonb
    ) as request_id;
  $$
);

-- Annual period generation (January 1st at 1 AM)
SELECT cron.schedule(
  'compliance-annual-generation',
  '0 1 1 1 *',
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:='{"action": "annual_generation"}'::jsonb
    ) as request_id;
  $$
);

-- Monthly period generation (1st day of each month at 1 AM)
SELECT cron.schedule(
  'compliance-monthly-generation',
  '0 1 1 * *',
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:='{"action": "monthly_generation"}'::jsonb
    ) as request_id;
  $$
);

-- Weekly period generation (every Monday at 1 AM)
SELECT cron.schedule(
  'compliance-weekly-generation',
  '0 1 * * 1',
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:='{"action": "weekly_generation"}'::jsonb
    ) as request_id;
  $$
);