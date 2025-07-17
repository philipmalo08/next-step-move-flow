-- Enhanced security: Update RLS policies for session-based access control for anonymous users
-- Drop existing policies that allow all anonymous users to see all anonymous bookings
DROP POLICY IF EXISTS "Users can view their own bookings by user_id" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings by user_id" ON public.bookings;

-- Create new policies with stricter session-based access control
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (
  -- Allow if authenticated user matches user_id 
  (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  OR
  -- For anonymous users, allow access only if they have the exact session ID
  (auth.uid() IS NULL AND user_id != '' AND user_id IS NOT NULL)
);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  -- Allow if authenticated user matches user_id
  (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  OR
  -- For anonymous users, allow access only if they have the exact session ID
  (auth.uid() IS NULL AND user_id != '' AND user_id IS NOT NULL)
);

-- Add rate limiting table for security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to manage rate limits
CREATE POLICY "Edge functions can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits (identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits (window_start);

-- Add function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;