-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule marketing email job to run every 6 hours
SELECT cron.schedule(
  'send-marketing-emails-job',
  '0 */6 * * *', -- every 6 hours
  $$
  SELECT
    net.http_post(
        url:='https://eqqggvtodrgbboebvglh.supabase.co/functions/v1/schedule-marketing-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWdndnRvZHJnYmJvZWJ2Z2xoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQ0MjI4NiwiZXhwIjoyMDY4MDE4Mjg2fQ.Y2lc1Fg4C0Zd5idpFfP8nMEoEwF6A1uZJLu5iEr1Hps"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);