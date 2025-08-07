import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  bookingData: any;
  bookingId: string;
  pdfBuffer: string; // Base64 encoded PDF
  language?: 'en' | 'fr';
}

// Email translations
const emailTranslations = {
  en: {
    title: "🚛 Booking Confirmed!",
    thankYou: "Thank you for choosing NextMovement",
    hello: "Hello",
    confirmed: "Your moving booking has been confirmed. Here are the details:",
    documentsTitle: "📄 Important Documents",
    documentsDesc: "Please find attached your detailed move confirmation and inventory checklist PDF. This document contains:",
    documentsFeature1: "Complete booking details and contact information",
    documentsFeature2: "Inventory checklist for pickup and delivery verification", 
    documentsFeature3: "Pricing breakdown and payment summary",
    documentsFeature4: "Signature sections for move completion",
    printReminder: "Please print and have this document ready on your move day.",
    bookingInfo: "📋 Booking Information",
    bookingId: "Booking ID",
    date: "Date",
    time: "Time",
    service: "Service",
    addresses: "📍 Addresses",
    pickup: "Pickup:",
    dropoff: "Drop-off:",
    itemsSummary: "📦 Items Summary",
    totalItems: "Total Items:",
    seeAttached: "See attached PDF for complete inventory checklist",
    paymentSummary: "💰 Payment Summary",
    subtotal: "Subtotal",
    gst: "GST",
    qst: "QST",
    total: "Total",
    nextSteps: "📞 Next Steps",
    step1: "Print the attached PDF - You'll need this for your move day",
    step2: "Review the inventory checklist - Ensure all items are listed correctly",
    step3: "Prepare for your move - We'll contact you 24 hours before to confirm details",
    step4: "Have the document ready - Our team will use it for pickup and delivery verification",
    contactNotice: "We'll contact you 24 hours before your move to confirm details and provide our team's contact information.",
    footer: "Thank you for choosing NextMovement!",
    contactUs: "Need help? Contact us at (438) 543-0904 or mouvementsuivant@outlook.com"
  },
  fr: {
    title: "🚛 Réservation Confirmée!",
    thankYou: "Merci d'avoir choisi NextMovement",
    hello: "Bonjour",
    confirmed: "Votre réservation de déménagement a été confirmée. Voici les détails:",
    documentsTitle: "📄 Documents Importants",
    documentsDesc: "Veuillez trouver en pièce jointe votre confirmation de déménagement détaillée et la liste de vérification d'inventaire PDF. Ce document contient:",
    documentsFeature1: "Détails complets de la réservation et informations de contact",
    documentsFeature2: "Liste de vérification d'inventaire pour la vérification du ramassage et de la livraison",
    documentsFeature3: "Détail des prix et résumé de paiement",
    documentsFeature4: "Sections de signature pour l'achèvement du déménagement",
    printReminder: "Veuillez imprimer et avoir ce document prêt le jour de votre déménagement.",
    bookingInfo: "📋 Informations de Réservation",
    bookingId: "ID de Réservation",
    date: "Date",
    time: "Heure",
    service: "Service",
    addresses: "📍 Adresses",
    pickup: "Ramassage:",
    dropoff: "Livraison:",
    itemsSummary: "📦 Résumé des Articles",
    totalItems: "Total des Articles:",
    seeAttached: "Voir le PDF ci-joint pour la liste complète de vérification d'inventaire",
    paymentSummary: "💰 Résumé de Paiement",
    subtotal: "Sous-total",
    gst: "TPS",
    qst: "TVQ",
    total: "Total",
    nextSteps: "📞 Prochaines Étapes",
    step1: "Imprimez le PDF ci-joint - Vous en aurez besoin le jour de votre déménagement",
    step2: "Examinez la liste de vérification d'inventaire - Assurez-vous que tous les articles sont listés correctement",
    step3: "Préparez-vous pour votre déménagement - Nous vous contacterons 24 heures avant pour confirmer les détails",
    step4: "Ayez le document prêt - Notre équipe l'utilisera pour la vérification du ramassage et de la livraison",
    contactNotice: "Nous vous contacterons 24 heures avant votre déménagement pour confirmer les détails et fournir les informations de contact de notre équipe.",
    footer: "Merci d'avoir choisi NextMovement!",
    contactUs: "Besoin d'aide? Contactez-nous au (438) 543-0904 ou mouvementsuivant@outlook.com"
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingData, bookingId, pdfBuffer, language = 'en' }: BookingConfirmationRequest = await req.json();
    
    const t = emailTranslations[language];

    const logoImage = language === 'fr' 
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/mouvementsuivant-final1.PNG'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/nextmovement-final.PNG';
    
    const thankYouImage = language === 'fr'
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/Mouvement Suivant Merci Courriel.png'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/public/assets/Next Movement Thank You Email.png';

    // Create email HTML with translations
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${t.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #ffffff; }
          .booking-details { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .total { font-size: 1.2em; font-weight: bold; color: #2563eb; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .pdf-notice { background: #e7f3ff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Logo -->
          <div style="text-align: center; padding: 20px 0; background-color: #ffffff;">
            <img src="${logoImage}" alt="Logo" style="max-height: 80px; width: auto;">
          </div>

          <div class="header">
            <h1>${t.title}</h1>
            <p>${t.thankYou}</p>
          </div>
          
          <div class="content">
            <h2>${t.hello} ${bookingData.paymentData.fullName}!</h2>
            <p>${t.confirmed}</p>
            
            <div class="pdf-notice">
              <h3>${t.documentsTitle}</h3>
              <p>${t.documentsDesc}</p>
              <ul>
                <li>${t.documentsFeature1}</li>
                <li>${t.documentsFeature2}</li>
                <li>${t.documentsFeature3}</li>
                <li>${t.documentsFeature4}</li>
              </ul>
              <p><strong>${t.printReminder}</strong></p>
            </div>
            
            <div class="booking-details">
              <h3>${t.bookingInfo}</h3>
              <p><strong>${t.bookingId}:</strong> ${bookingId}</p>
              <p><strong>${t.date}:</strong> ${new Date(bookingData.date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA')}</p>
              <p><strong>${t.time}:</strong> ${bookingData.time}</p>
              <p><strong>${t.service}:</strong> ${bookingData.serviceTier.name}</p>
            </div>
            
            <div class="booking-details">
              <h3>${t.addresses}</h3>
              <p><strong>${t.pickup}</strong></p>
              ${bookingData.addresses.filter((addr: any) => addr.type === 'pickup').map((addr: any) => `<p>• ${addr.address}</p>`).join('')}
              <p><strong>${t.dropoff}</strong></p>
              ${bookingData.addresses.filter((addr: any) => addr.type === 'dropoff').map((addr: any) => `<p>• ${addr.address}</p>`).join('')}
            </div>
            
            <div class="booking-details">
              <h3>${t.itemsSummary}</h3>
              <p><strong>${t.totalItems}</strong> ${bookingData.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</p>
              <p><em>${t.seeAttached}</em></p>
            </div>
            
            <div class="booking-details">
              <h3>${t.paymentSummary}</h3>
              <p>${t.subtotal}: $${bookingData.quote.subtotal.toFixed(2)}</p>
              <p>${t.gst}: $${bookingData.quote.gst.toFixed(2)}</p>
              <p>${t.qst}: $${bookingData.quote.qst.toFixed(2)}</p>
              <p class="total">${t.total}: $${bookingData.quote.total.toFixed(2)}</p>
            </div>
            
            <div class="booking-details">
              <h3>${t.nextSteps}</h3>
              <p>1. <strong>${t.step1}</strong></p>
              <p>2. <strong>${t.step2}</strong></p>
              <p>3. <strong>${t.step3}</strong></p>
              <p>4. <strong>${t.step4}</strong></p>
            </div>
            
            <p>${t.contactNotice}</p>
          </div>

          <!-- Thank You Image -->
          <div style="text-align: center; padding: 20px;">
            <img src="${thankYouImage}" alt="Thank You" style="max-width: 100%; height: auto;">
          </div>
          
          <div class="footer">
            <p>${t.footer}</p>
            <p>${t.contactUs}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email with PDF attachment using SendGrid
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SENDGRID_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: "noreply@nextmovement.ca",
          name: "NextMovement Moving Services"
        },
        to: [{
          email: bookingData.paymentData.email,
          name: bookingData.paymentData.fullName
        }],
        subject: `Booking Confirmation & Move Documents - ${bookingId}`,
        content: [{
          type: "text/html",
          value: emailHtml
        }],
        attachments: [{
          content: pdfBuffer,
          filename: `NextMovement-Booking-${bookingId}.pdf`,
          type: "application/pdf",
          disposition: "attachment"
        }]
      })
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("SendGrid error:", errorText);
      throw new Error(`SendGrid API error: ${sendGridResponse.status}`);
    }

    console.log("Booking confirmation email with PDF sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);