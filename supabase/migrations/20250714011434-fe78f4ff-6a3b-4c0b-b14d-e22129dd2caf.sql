-- Update device_sessions table to improve security and RLS policies
-- First, let's improve the RLS policy to be more restrictive
DROP POLICY IF EXISTS "Allow device session access" ON public.device_sessions;

-- Create more secure RLS policies for device sessions
CREATE POLICY "Device sessions select policy" 
ON public.device_sessions 
FOR SELECT 
USING (
  -- Allow access to sessions created within the last 24 hours
  created_at > now() - interval '24 hours'
);

CREATE POLICY "Device sessions insert policy" 
ON public.device_sessions 
FOR INSERT 
WITH CHECK (
  -- Allow insertion with device_id length validation
  length(device_id) = 32 AND
  device_id ~ '^[a-f0-9]+$'
);

CREATE POLICY "Device sessions update policy" 
ON public.device_sessions 
FOR UPDATE 
USING (
  -- Only allow updates to sessions created within the last 24 hours
  created_at > now() - interval '24 hours'
);

-- Add indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON public.device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_created_at ON public.device_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_device_sessions_expires_at ON public.device_sessions(expires_at);

-- Create a function to clean up expired sessions (security housekeeping)
CREATE OR REPLACE FUNCTION public.cleanup_expired_device_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.device_sessions 
  WHERE expires_at < now() OR created_at < now() - interval '7 days';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cleanup_expired_device_sessions() TO authenticated;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_device_sessions_updated_at
BEFORE UPDATE ON public.device_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();