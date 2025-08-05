import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChecklistEmailRequest {
  email: string;
  language: 'en' | 'fr';
}

const emailTranslations = {
  en: {
    subject: 'Your Moving Checklist - Next Movement',
    greeting: 'Hello!',
    message: 'Thank you for your interest in Next Movement! Please find attached your comprehensive moving checklist to help make your move smooth and organized.',
    checklistTitle: 'Moving Checklist',
    bookButton: 'Book now',
    footer: 'Need help with your move? Contact us anytime!',
    signature: 'Best regards,<br>Next Movement Team'
  },
  fr: {
    subject: 'Votre Liste de Vérification - Mouvement Suivant',
    greeting: 'Bonjour!',
    message: 'Merci de votre intérêt pour Mouvement Suivant! Veuillez trouver en pièce jointe votre liste complète de vérification de déménagement pour vous aider à organiser votre déménagement.',
    checklistTitle: 'Liste de Vérification de Déménagement',
    bookButton: 'Réservez maintenant',
    footer: 'Besoin d\'aide pour votre déménagement? Contactez-nous à tout moment!',
    signature: 'Meilleures salutations,<br>Équipe Mouvement Suivant'
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const { email, language }: ChecklistEmailRequest = await req.json();
    const lang = language || 'en';
    const translations = emailTranslations[lang];
    
    // Get the appropriate PDF file paths and images
    const pdfFileName = language === 'fr' 
      ? 'Mouvement Suivant Liste de demenagement.pdf'
      : 'Next Movement Moving-Checklist.pdf';
    
    const logoImage = language === 'fr' 
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/mouvementsuivant-final1.PNG'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/nextmovement-final.PNG';
    
    const bottomImage = language === 'fr'
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/Mouvement Suivant Liste Courriel.png'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/Next Movement Checklist Email.png';

    const websiteUrl = language === 'fr' ? 'https://mouvementsuivant.ca' : 'https://nextmovement.ca';

    // Read the PDF file
    const pdfPath = `/assets/${pdfFileName}`;
    let pdfBuffer: ArrayBuffer;
    try {
      const pdfResponse = await fetch(`https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public${pdfPath}`);
      if (!pdfResponse.ok) {
        throw new Error(`PDF not found: ${pdfFileName}`);
      }
      pdfBuffer = await pdfResponse.arrayBuffer();
    } catch (error) {
      console.error('Error fetching PDF:', error);
      throw new Error(`Could not fetch PDF: ${pdfFileName}`);
    }

    // Convert PDF to base64
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${translations.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Logo -->
          <div style="text-align: center; padding: 20px 0; background-color: #ffffff;">
            <img src="${logoImage}" alt="Logo" style="max-height: 80px; width: auto;">
          </div>
          
          <!-- Main content -->
          <div style="padding: 30px;">
            <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">${translations.greeting}</h1>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              ${translations.message}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${websiteUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                ${translations.bookButton}
              </a>
            </div>

            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              ${translations.footer}
            </p>

            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              ${translations.signature}
            </p>
          </div>

          <!-- Bottom Image -->
          <div style="text-align: center; padding: 20px;">
            <img src="${bottomImage}" alt="Moving Checklist" style="max-width: 100%; height: auto;">
          </div>
        </div>
      </body>
      </html>
    `;

    const emailData = {
      personalizations: [{
        to: [{ email }],
        subject: translations.subject
      }],
      from: { email: "mouvementsuivant@outlook.com", name: language === 'fr' ? "Mouvement Suivant" : "Next Movement" },
      content: [{
        type: 'text/html',
        value: htmlContent
      }],
      attachments: [{
        content: pdfBase64,
        filename: pdfFileName,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    };

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

    console.log('Checklist email sent successfully to:', email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-checklist-email function:', error);
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