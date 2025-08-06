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
          // Determine language based on email domain or default to English
          const language = emailRecord.email.includes('@') && emailRecord.user_session_id 
            ? (emailRecord.user_session_id.includes('fr') ? 'fr' : 'en')
            : 'en';
            
          await sendChatbotMarketingEmail(emailRecord.email, language);
          
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
          // Determine language based on quote_data or default to English
          const language = emailRecord.quote_data?.language || 'en';
          await sendQuoteReminderEmail(emailRecord.email, emailRecord.quote_amount, emailRecord.quote_data, language);
          
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

// Send marketing email to chatbot users
async function sendChatbotMarketingEmail(email: string, language: 'en' | 'fr' = 'en') {
  const isEnglish = language === 'en';
  const subject = isEnglish 
    ? 'Ready to make your move? Next Movement is here to help!'
    : 'Prêt à déménager? Mouvement Suivant est là pour vous aider!';

  const logoImage = isEnglish 
    ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/nextmovement-final.png'
    : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/mouvementsuivant-final1.png';
  
  const bottomImage = isEnglish
    ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/next-movement-mt-email.png'
    : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/mouvement-suivant-courriel-mt.png';

  const websiteUrl = isEnglish ? 'https://nextmovement.ca' : 'https://mouvementsuivant.ca';

  const emailData = {
    personalizations: [
      {
        to: [{ email }],
        subject
      }
    ],
    from: { 
      email: "mouvementsuivant@outlook.com", 
      name: isEnglish ? "Next Movement" : "Mouvement Suivant"
    },
    content: [
      {
        type: "text/html",
        value: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Logo -->
              <div style="text-align: center; padding: 20px 0; background-color: #ffffff;">
                <img src="${logoImage}" alt="Logo" style="max-height: 80px; width: auto;">
              </div>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: bold;">
                  ${isEnglish ? 'Ready to Move?' : 'Prêt à Déménager?'}
                </h1>
                <p style="color: #ffffff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">
                  ${isEnglish ? 'Let us make your move stress-free!' : 'Laissez-nous rendre votre déménagement sans stress!'}
                </p>
              </div>
              
              <div style="padding: 40px 30px;">
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  ${isEnglish 
                    ? 'Hi there! We noticed you were interested in our moving services. We\'re here to make your move as smooth as possible with our professional team and transparent pricing.'
                    : 'Bonjour! Nous avons remarqué que vous étiez intéressé par nos services de déménagement. Nous sommes là pour rendre votre déménagement aussi fluide que possible avec notre équipe professionnelle et nos prix transparents.'}
                </p>
                
                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px 0;">
                    ${isEnglish ? 'Why Choose Next Movement?' : 'Pourquoi Choisir Mouvement Suivant?'}
                  </h3>
                  <ul style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>${isEnglish ? 'Professional and experienced movers' : 'Déménageurs professionnels et expérimentés'}</li>
                    <li>${isEnglish ? 'Transparent and competitive pricing' : 'Prix transparents et compétitifs'}</li>
                    <li>${isEnglish ? 'Full insurance coverage' : 'Couverture d\'assurance complète'}</li>
                    <li>${isEnglish ? 'Same-day booking available' : 'Réservation le jour même disponible'}</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${websiteUrl}" 
                     style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
                    ${isEnglish ? 'Book now' : 'Réservez maintenant'}
                  </a>
                </div>
                
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                  ${isEnglish 
                    ? 'Have questions? Reply to this email or visit our website. We\'re here to help make your move successful!'
                    : 'Des questions? Répondez à ce courriel ou visitez notre site web. Nous sommes là pour vous aider à réussir votre déménagement!'}
                </p>
                
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                  ${isEnglish ? 'Best regards,' : 'Meilleures salutations,'}<br>
                  ${isEnglish ? 'Next Movement Team' : 'Équipe Mouvement Suivant'}
                </p>
              </div>

              <!-- Bottom Image -->
              <div style="text-align: center; padding: 20px;">
                <img src="${bottomImage}" alt="Marketing" style="max-width: 100%; height: auto;">
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

// Send quote reminder email with all quote details
async function sendQuoteReminderEmail(email: string, quoteAmount: number, quoteData: any, language: 'en' | 'fr' = 'en') {
  const isEnglish = language === 'en';
  const subject = isEnglish 
    ? `Don't forget your $${quoteAmount.toFixed(2)} moving quote!`
    : `N'oubliez pas votre devis de ${quoteAmount.toFixed(2)}$ pour votre déménagement!`;

  const logoImage = isEnglish 
    ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/nextmovement-final.png'
    : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/mouvementsuivant-final1.png';
  
  const bottomImage = isEnglish
    ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/next-movement-book-email.png'
    : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/mouvement-suivant-reservez-courriel.png';

  const websiteUrl = isEnglish ? 'https://nextmovement.ca' : 'https://mouvementsuivant.ca';

  // Extract quote details for display
  const serviceTier = quoteData?.serviceTier || (isEnglish ? 'Standard Service' : 'Service Standard');
  const pickupAddress = quoteData?.pickupAddresses?.[0] || (isEnglish ? 'Address provided' : 'Adresse fournie');
  const dropoffAddress = quoteData?.dropoffAddresses?.[0] || (isEnglish ? 'Address provided' : 'Adresse fournie');
  const moveDate = quoteData?.moveDate || (isEnglish ? 'Date to be confirmed' : 'Date à confirmer');

  const emailData = {
    personalizations: [
      {
        to: [{ email }],
        subject
      }
    ],
    from: { 
      email: "mouvementsuivant@outlook.com", 
      name: isEnglish ? "Next Movement" : "Mouvement Suivant"
    },
    content: [
      {
        type: "text/html",
        value: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Logo -->
              <div style="text-align: center; padding: 20px 0; background-color: #ffffff;">
                <img src="${logoImage}" alt="Logo" style="max-height: 80px; width: auto;">
              </div>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">
                  ${isEnglish ? 'Your moving quote is ready!' : 'Votre devis de déménagement est prêt!'}
                </h1>
                <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
                  ${isEnglish ? 'All the details of your personalized quote' : 'Tous les détails de votre devis personnalisé'}
                </p>
              </div>
              
              <div style="background: white; padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  ${isEnglish 
                    ? 'Thank you for requesting a quote with Next Movement. Here are all the details of your personalized moving quote:'
                    : 'Merci d\'avoir demandé un devis avec Mouvement Suivant. Voici tous les détails de votre devis de déménagement personnalisé:'}
                </p>
                
                <!-- Quote Amount Box -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 25px 0;">
                  <h3 style="margin: 0 0 10px 0; font-size: 24px;">
                    ${isEnglish ? 'Your Quote' : 'Votre Devis'}
                  </h3>
                  <p style="margin: 0; font-size: 32px; font-weight: bold;">$${quoteAmount.toFixed(2)}</p>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">
                    ${isEnglish ? 'All taxes included' : 'Toutes taxes incluses'}
                  </p>
                </div>

                <!-- Quote Details -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #667eea; margin-top: 0;">
                    ${isEnglish ? 'Quote Details:' : 'Détails du Devis:'}
                  </h3>
                  <ul style="margin: 0; padding-left: 20px; color: #666;">
                    <li><strong>${isEnglish ? 'Service:' : 'Service:'}</strong> ${serviceTier}</li>
                    <li><strong>${isEnglish ? 'Pickup:' : 'Enlèvement:'}</strong> ${pickupAddress}</li>
                    <li><strong>${isEnglish ? 'Delivery:' : 'Livraison:'}</strong> ${dropoffAddress}</li>
                    <li><strong>${isEnglish ? 'Date:' : 'Date:'}</strong> ${moveDate}</li>
                  </ul>
                </div>
                
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1976d2; margin-top: 0;">
                    ${isEnglish ? 'Ready to book your move?' : 'Prêt à réserver votre déménagement?'}
                  </h3>
                  <p style="margin-bottom: 0; color: #666;">
                    ${isEnglish 
                      ? 'Our professional team is standing by to make your move smooth and stress-free. Book now to secure your preferred moving date!'
                      : 'Notre équipe professionnelle est prête à rendre votre déménagement fluide et sans stress. Réservez maintenant pour sécuriser votre date de déménagement préférée!'}
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${websiteUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; margin-right: 10px;">
                    ${isEnglish ? 'Book now' : 'Réservez maintenant'}
                  </a>
                  <a href="${websiteUrl}" style="background: transparent; color: #667eea; padding: 15px 30px; text-decoration: none; border: 2px solid #667eea; border-radius: 50px; font-weight: bold; display: inline-block;">
                    ${isEnglish ? 'Get New Quote' : 'Nouveau Devis'}
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  <strong>${isEnglish ? 'This quote is valid for 30 days.' : 'Ce devis est valide pendant 30 jours.'}</strong> 
                  ${isEnglish 
                    ? 'Our prices include professional packing materials, insurance coverage, and experienced movers.'
                    : 'Nos prix incluent les matériaux d\'emballage professionnels, la couverture d\'assurance et des déménageurs expérimentés.'}
                </p>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    ${isEnglish ? 'Questions about your quote?' : 'Questions sur votre devis?'}<br>
                    ${isEnglish 
                      ? 'Contact us at mouvementsuivant@outlook.com<br><br>Best regards,<br>The Next Movement Team'
                      : 'Contactez-nous à mouvementsuivant@outlook.com<br><br>Meilleures salutations,<br>L\'équipe Mouvement Suivant'}
                  </p>
                </div>
              </div>

              <!-- Bottom Image -->
              <div style="text-align: center; padding: 20px;">
                <img src="${bottomImage}" alt="Book Now" style="max-width: 100%; height: auto;">
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