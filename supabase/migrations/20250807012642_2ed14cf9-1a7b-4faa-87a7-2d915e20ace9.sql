-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension if not already enabled  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule marketing emails to run every hour
SELECT cron.schedule(
  'send-marketing-emails-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://eqqggvtodrgbboebvglh.supabase.co/functions/v1/send-marketing-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWdndnRvZHJnYmJvZWJ2Z2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NDIyODYsImV4cCI6MjA2ODAxODI4Nn0.Tm1XpFIopztqPXT3NgNcVkHOjsKecjbMu9gmTW4XWJ8"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);