import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

interface CleanupRequest {
  action: 'cleanup_expired_sessions';
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (clientId: string, maxRequests: number = 5): boolean => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const userLimit = rateLimitStore.get(clientId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
};

const logSecurityEvent = (event: string, details: Record<string, any>) => {
  console.warn(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientId)) {
      logSecurityEvent('cleanup_rate_limit_exceeded', { clientId });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { action }: CleanupRequest = await req.json();

    if (action !== 'cleanup_expired_sessions') {
      logSecurityEvent('invalid_cleanup_action', { action, clientId });
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Import Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Execute cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_device_sessions');

    if (error) {
      logSecurityEvent('cleanup_function_error', { error: error.message, clientId });
      throw new Error(`Cleanup failed: ${error.message}`);
    }

    logSecurityEvent('session_cleanup_completed', { clientId, timestamp: new Date().toISOString() });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Expired sessions cleaned up successfully',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    logSecurityEvent('cleanup_handler_error', { 
      error: errorMessage, 
      clientId,
      stack: error.stack?.substring(0, 500) 
    });
    
    console.error('Error in security-cleanup function:', error);
    
    // Don't expose internal error details to client
    const safeErrorMessage = errorMessage.includes('Invalid') ? errorMessage : 'Service temporarily unavailable';
    
    return new Response(
      JSON.stringify({ error: safeErrorMessage }),
      {
        status: errorMessage.includes('Rate limit') ? 429 : 
               errorMessage.includes('Invalid') ? 400 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);