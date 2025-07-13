import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const { to, subject, html, from = 'Next Movement <noreply@yourdomain.com>' }: EmailRequest = await req.json();

    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject
        }
      ],
      from: { email: from.includes('<') ? from.split('<')[1].split('>')[0] : from, name: from.includes('<') ? from.split('<')[0].trim() : 'Next Movement' },
      content: [
        {
          type: 'text/html',
          value: html
        }
      ]
    };

    console.log('Sending email to:', to);
    console.log('Email data:', JSON.stringify(emailData, null, 2));

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API error:', response.status, errorText);
      throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
    }

    console.log('Email sent successfully');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);