import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

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
    subject: 'Your Moving Checklist from Next Movement',
    title: 'Your Moving Checklist',
    subtitle: 'Thank you for requesting our moving checklist! This comprehensive guide will help you prepare for your move.',
    intro: 'Our detailed checklist covers everything you need to know for a successful move, from planning to completion.',
    downloadInfo: 'You can download your moving checklist using the button below:',
    contact: 'If you have any questions about your upcoming move, feel free to contact us at mouvementsuivant@outlook.com',
    footer: 'Thank you for choosing Next Movement for your moving needs!',
    bookButton: 'Book Your Move Now',
    downloadButton: 'Download PDF Checklist'
  },
  fr: {
    subject: 'Votre liste de déménagement de Mouvement Suivant',
    title: 'Votre liste de déménagement',
    subtitle: 'Merci d\'avoir demandé notre liste de déménagement! Ce guide complet vous aidera à préparer votre déménagement.',
    intro: 'Notre liste détaillée couvre tout ce que vous devez savoir pour un déménagement réussi, de la planification à la réalisation.',
    downloadInfo: 'Vous pouvez télécharger votre liste de déménagement en utilisant le bouton ci-dessous:',
    contact: 'Si vous avez des questions concernant votre déménagement à venir, n\'hésitez pas à nous contacter à mouvementsuivant@outlook.com',
    footer: 'Merci d\'avoir choisi Mouvement Suivant pour vos besoins de déménagement!',
    bookButton: 'Réservez votre déménagement maintenant',
    downloadButton: 'Télécharger la liste PDF'
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
    const t = emailTranslations[lang];
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const logoImage = language === 'fr' 
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/mouvementsuivant-final1.PNG'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/nextmovement-final.PNG';
    
    const bottomImage = language === 'fr'
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/Mouvement Suivant Liste Courriel.png'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/Next Movement Checklist Email.png';

    const websiteUrl = language === 'fr' ? 'https://mouvementsuivant.ca' : 'https://nextmovement.ca';

    // Get PDF file from storage and attach it
    const pdfUrl = language === 'fr'
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/Mouvement Suivant Liste de demenagement.pdf'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/Next Movement Moving-Checklist.pdf';
    
    // Fetch PDF content
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF file');
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t.subject}</title>
          <style>
            .content { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; margin-bottom: 20px; }
            .footer { text-align: center; color: #666; margin-top: 30px; }
            .contact { background: #3B82F6; color: white; padding: 15px; text-align: center; border-radius: 8px; margin-top: 20px; }
            .download-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; text-align: center; }
            .download-button { display: inline-block; background-color: #10B981; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; margin: 10px; }
            .book-button { display: inline-block; background-color: #3B82F6; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Logo -->
            <div style="text-align: center; padding: 20px 0; background-color: #ffffff;">
              <img src="${logoImage}" alt="Logo" style="max-height: 80px; width: auto;">
            </div>
            
            <div class="header">
              <h1>${t.title}</h1>
              <p>${t.subtitle}</p>
            </div>

            <div class="content">
              <p>${t.intro}</p>
              
              <div class="download-section">
                <h3>📋 ${language === 'fr' ? 'Votre liste de déménagement' : 'Your Moving Checklist'}</h3>
                <p>${language === 'fr' ? 'Votre liste de déménagement détaillée est incluse en pièce jointe à ce courriel.' : 'Your detailed moving checklist is included as an attachment to this email.'}</p>
                <p style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                  <strong>📎 ${language === 'fr' ? 'Pièce jointe incluse' : 'Attachment Included'}</strong><br>
                  ${language === 'fr' ? 'Veuillez vérifier vos pièces jointes pour télécharger votre liste de déménagement PDF.' : 'Please check your attachments to download your moving checklist PDF.'}
                </p>
              </div>

              <p>${t.contact}</p>
            </div>

            <!-- Book Now Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${websiteUrl}" class="book-button">
                ${t.bookButton}
              </a>
            </div>

            <div class="contact">
              <p><strong>${t.footer}</strong></p>
              <p>Contact: mouvementsuivant@outlook.com</p>
            </div>

            <!-- Bottom Image -->
            <div style="text-align: center; padding: 20px;">
              <img src="${bottomImage}" alt="Checklist" style="max-width: 100%; height: auto;">
            </div>

            <div class="footer">
              <p>&copy; 2024 ${language === 'fr' ? 'Mouvement Suivant' : 'Next Movement'}. ${language === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailData = {
      personalizations: [{
        to: [{ email }],
        subject: t.subject
      }],
      from: { email: "mouvementsuivant@outlook.com", name: language === 'fr' ? "Mouvement Suivant" : "Next Movement" },
      content: [{
        type: 'text/html',
        value: htmlContent
      }],
      attachments: [{
        content: pdfBase64,
        filename: language === 'fr' ? 'Mouvement-Suivant-Liste-Demenagement.pdf' : 'Next-Movement-Moving-Checklist.pdf',
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

    // Store the email in the database for marketing follow-up
    await supabase.from('chatbot_emails').insert({
      email: email,
      user_session_id: email, // Use email as session ID for checklist requests
      questions_asked: 0,
      marketing_email_sent: false
    });

    console.log('Email stored in database for marketing follow-up');

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