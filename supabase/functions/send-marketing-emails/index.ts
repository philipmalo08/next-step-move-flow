import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting marketing email job...');
    
    // Get chatbot emails that need marketing emails (24+ hours old, not sent)
    const { data: chatbotEmails, error: chatbotError } = await supabase
      .from('chatbot_emails')
      .select('*')
      .eq('marketing_email_sent', false)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (chatbotError) {
      console.error('Error fetching chatbot emails:', chatbotError);
    } else {
      console.log(`Found ${chatbotEmails?.length || 0} chatbot emails to process`);
      
      for (const emailRecord of chatbotEmails || []) {
        try {
          await sendChatbotMarketingEmail(emailRecord.email);
          
          // Mark as sent
          await supabase
            .from('chatbot_emails')
            .update({ 
              marketing_email_sent: true, 
              marketing_email_sent_at: new Date().toISOString() 
            })
            .eq('id', emailRecord.id);
            
          console.log(`Sent chatbot marketing email to: ${emailRecord.email}`);
        } catch (error) {
          console.error(`Failed to send chatbot marketing email to ${emailRecord.email}:`, error);
        }
      }
    }

    // Get quote emails that need marketing emails (24+ hours old, not sent)
    const { data: quoteEmails, error: quoteError } = await supabase
      .from('quote_emails')
      .select('*')
      .eq('marketing_email_sent', false)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (quoteError) {
      console.error('Error fetching quote emails:', quoteError);
    } else {
      console.log(`Found ${quoteEmails?.length || 0} quote emails to process`);
      
      for (const emailRecord of quoteEmails || []) {
        try {
          await sendQuoteReminderEmail(emailRecord.email, emailRecord.quote_amount);
          
          // Mark as sent
          await supabase
            .from('quote_emails')
            .update({ 
              marketing_email_sent: true, 
              marketing_email_sent_at: new Date().toISOString() 
            })
            .eq('id', emailRecord.id);
            
          console.log(`Sent quote reminder email to: ${emailRecord.email}`);
        } catch (error) {
          console.error(`Failed to send quote reminder email to ${emailRecord.email}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chatbotEmailsProcessed: chatbotEmails?.length || 0,
        quoteEmailsProcessed: quoteEmails?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in marketing email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendChatbotMarketingEmail(email: string) {
  const emailData = {
    personalizations: [
      {
        to: [{ email }],
        subject: "Still need help with your move? We're here for you!"
      }
    ],
    from: { email: "noreply@nextmovement.ca", name: "Next Movement" },
    content: [
      {
        type: "text/html",
        value: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Next Movement - We're Here to Help</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Next Movement</h1>
                  <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Professional Moving Services</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; margin-top: 0;">Still need help with your move?</h2>
                  
                  <p>Hi there!</p>
                  
                  <p>We noticed you had some questions about moving yesterday. Our team is here to help make your move as smooth as possible!</p>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #667eea; margin-top: 0;">Why choose Next Movement?</h3>
                      <ul style="margin: 0; padding-left: 20px;">
                          <li>Professional and experienced movers</li>
                          <li>Comprehensive insurance coverage</li>
                          <li>Transparent pricing with no hidden fees</li>
                          <li>Same-day quotes available</li>
                          <li>Excellent customer service and support</li>
                      </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="https://nextmovement.ca" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Get Your Free Quote</a>
                  </div>
                  
                  <p>Have more questions? Feel free to reach out to us anytime. We're here to help!</p>
                  
                  <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                      <p style="margin: 0; color: #666; font-size: 14px;">
                          Best regards,<br>
                          The Next Movement Team<br>
                          📧 info@nextmovement.ca<br>
                          📱 (514) 123-4567
                      </p>
                  </div>
              </div>
          </body>
          </html>
        `
      }
    ]
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
  }
}

async function sendQuoteReminderEmail(email: string, quoteAmount: number) {
  const emailData = {
    personalizations: [
      {
        to: [{ email }],
        subject: `Don't forget your $${quoteAmount.toFixed(2)} moving quote!`
      }
    ],
    from: { email: "noreply@nextmovement.ca", name: "Next Movement" },
    content: [
      {
        type: "text/html",
        value: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Next Movement - Your Quote is Waiting</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Next Movement</h1>
                  <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Professional Moving Services</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; margin-top: 0;">Your moving quote is ready!</h2>
                  
                  <p>Hi there!</p>
                  
                  <p>Thank you for requesting a quote with Next Movement. We wanted to remind you about your personalized moving quote:</p>
                  
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 25px 0;">
                      <h3 style="margin: 0 0 10px 0; font-size: 24px;">Your Quote</h3>
                      <p style="margin: 0; font-size: 32px; font-weight: bold;">$${quoteAmount.toFixed(2)}</p>
                      <p style="margin: 10px 0 0 0; opacity: 0.9;">All taxes included</p>
                  </div>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #667eea; margin-top: 0;">Ready to book your move?</h3>
                      <p style="margin-bottom: 0;">Our professional team is standing by to make your move smooth and stress-free. Book now to secure your preferred moving date!</p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="https://nextmovement.ca" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; margin-right: 10px;">Book Now</a>
                      <a href="https://nextmovement.ca" style="background: transparent; color: #667eea; padding: 15px 30px; text-decoration: none; border: 2px solid #667eea; border-radius: 50px; font-weight: bold; display: inline-block;">Get New Quote</a>
                  </div>
                  
                  <p><strong>This quote is valid for 30 days.</strong> Our prices include professional packing materials, insurance coverage, and experienced movers.</p>
                  
                  <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                      <p style="margin: 0; color: #666; font-size: 14px;">
                          Questions about your quote?<br>
                          Contact us at info@nextmovement.ca or (514) 123-4567<br><br>
                          Best regards,<br>
                          The Next Movement Team
                      </p>
                  </div>
              </div>
          </body>
          </html>
        `
      }
    ]
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
  }
}