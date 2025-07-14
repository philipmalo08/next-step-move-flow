-- Set up automated security cleanup with cron job
-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the security cleanup to run every hour
SELECT cron.schedule(
  'security-cleanup-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://eqqggvtodrgbboebvglh.supabase.co/functions/v1/security-cleanup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWdndnRvZHJnYmJvZWJ2Z2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NDIyODYsImV4cCI6MjA2ODAxODI4Nn0.Tm1XpFIopztqPXT3NgNcVkHOjsKecjbMu9gmTW4XWJ8"}'::jsonb,
    body := '{"action": "cleanup_expired_sessions"}'::jsonb
  );
  $$
);

-- Also enable pg_net extension for HTTP requests if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;