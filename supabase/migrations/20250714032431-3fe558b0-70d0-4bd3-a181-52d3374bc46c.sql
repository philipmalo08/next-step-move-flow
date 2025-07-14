-- Remove device_sessions table and related cleanup function
DROP TABLE IF EXISTS public.device_sessions CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_device_sessions() CASCADE;