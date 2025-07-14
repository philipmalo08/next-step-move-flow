import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Minimal input validation - just basic safety checks
const validateInput = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false;
  if (input.length < 1 || input.length > 500) return false;
  return true;
};

const checkRateLimit = (clientId: string, maxRequests: number = 10): boolean => {
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

interface MapsRequest {
  service: 'geocoding' | 'distance';
  address?: string;
  origin?: string;
  destination?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientId)) {
      logSecurityEvent('rate_limit_exceeded', { clientId });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { service, address, origin, destination }: MapsRequest = await req.json();
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    let url: string;
    
    if (service === 'geocoding' && address) {
      // Basic validation only
      if (!validateInput(address)) {
        throw new Error('Invalid address format');
      }
      
      // Use address as-is, add Canada restriction only for very short queries
      const addressToUse = address.trim().length < 3 ? `${address.trim()}, Canada` : address.trim();
      
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToUse)}&key=${apiKey}&region=ca&components=country:CA`;
    } else if (service === 'distance' && origin && destination) {
      // Basic validation only
      if (!validateInput(origin) || !validateInput(destination)) {
        throw new Error('Invalid origin or destination format');
      }
      
      url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin.trim())}&destinations=${encodeURIComponent(destination.trim())}&key=${apiKey}&region=ca`;
    } else {
      logSecurityEvent('invalid_service_request', { service, hasAddress: !!address, hasOrigin: !!origin, hasDestination: !!destination, clientId });
      throw new Error('Invalid request parameters');
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      logSecurityEvent('maps_api_error', { status: response.status, statusText: response.statusText, clientId });
      throw new Error(`Maps API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate response data structure
    if (service === 'geocoding' && (!data.results || !Array.isArray(data.results))) {
      logSecurityEvent('invalid_geocoding_response', { clientId });
      throw new Error('Invalid geocoding response');
    }
    
    if (service === 'distance' && (!data.rows || !Array.isArray(data.rows))) {
      logSecurityEvent('invalid_distance_response', { clientId });
      throw new Error('Invalid distance response');
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    logSecurityEvent('maps_api_handler_error', { 
      error: errorMessage, 
      clientId,
      stack: error.stack?.substring(0, 500) 
    });
    
    console.error('Error in maps-api function:', error);
    
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