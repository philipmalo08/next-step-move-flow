import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecaptchaVerificationRequest {
  token: string;
  action: string;
}

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action }: RecaptchaVerificationRequest = await req.json();
    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');

    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the reCAPTCHA token with Google
    const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const result: RecaptchaResponse = await verificationResponse.json();
    
    console.log('reCAPTCHA verification result:', {
      success: result.success,
      score: result.score,
      action: result.action,
      expectedAction: action,
      hostname: result.hostname
    });

    // Check if verification was successful
    if (!result.success) {
      console.error('reCAPTCHA verification failed:', result['error-codes']);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA verification failed',
          errorCodes: result['error-codes']
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if the action matches what we expected
    if (result.action !== action) {
      console.error(`Action mismatch: expected ${action}, got ${result.action}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Action mismatch' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check the score (for v3, lower scores indicate more likely bot behavior)
    // Typically, scores above 0.5 are considered human-like
    const minScore = action === 'booking_submit' ? 0.3 : 0.5; // Lower threshold for critical actions
    
    if (result.score < minScore) {
      console.warn(`Low reCAPTCHA score: ${result.score} for action ${action}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Low confidence score',
          score: result.score
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verification successful
    return new Response(
      JSON.stringify({ 
        success: true, 
        score: result.score,
        action: result.action
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-recaptcha function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});