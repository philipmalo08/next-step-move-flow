-- Fix security issue: Set immutable search_path for cleanup_rate_limits function
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';