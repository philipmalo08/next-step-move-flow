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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingData, bookingId, pdfBuffer }: BookingConfirmationRequest = await req.json();

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .total { font-size: 1.2em; font-weight: bold; color: #2563eb; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .pdf-notice { background: #e7f3ff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚛 Booking Confirmed!</h1>
            <p>Thank you for choosing NextMovement</p>
          </div>
          
          <div class="content">
            <h2>Hello ${bookingData.paymentData.fullName}!</h2>
            <p>Your moving booking has been confirmed. Here are the details:</p>
            
            <div class="pdf-notice">
              <h3>📄 Important Documents</h3>
              <p>Please find attached your detailed move confirmation and inventory checklist PDF. This document contains:</p>
              <ul>
                <li>Complete booking details and contact information</li>
                <li>Inventory checklist for pickup and delivery verification</li>
                <li>Pricing breakdown and payment summary</li>
                <li>Signature sections for move completion</li>
              </ul>
              <p><strong>Please print and have this document ready on your move day.</strong></p>
            </div>
            
            <div class="booking-details">
              <h3>📋 Booking Information</h3>
              <p><strong>Booking ID:</strong> ${bookingId}</p>
              <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${bookingData.time}</p>
              <p><strong>Service:</strong> ${bookingData.serviceTier.name}</p>
            </div>
            
            <div class="booking-details">
              <h3>📍 Addresses</h3>
              <p><strong>Pickup:</strong></p>
              ${bookingData.addresses.filter((addr: any) => addr.type === 'pickup').map((addr: any) => `<p>• ${addr.address}</p>`).join('')}
              <p><strong>Drop-off:</strong></p>
              ${bookingData.addresses.filter((addr: any) => addr.type === 'dropoff').map((addr: any) => `<p>• ${addr.address}</p>`).join('')}
            </div>
            
            <div class="booking-details">
              <h3>📦 Items Summary</h3>
              <p><strong>Total Items:</strong> ${bookingData.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</p>
              <p><em>See attached PDF for complete inventory checklist</em></p>
            </div>
            
            <div class="booking-details">
              <h3>💰 Payment Summary</h3>
              <p>Subtotal: $${bookingData.quote.subtotal.toFixed(2)}</p>
              <p>GST: $${bookingData.quote.gst.toFixed(2)}</p>
              <p>QST: $${bookingData.quote.qst.toFixed(2)}</p>
              <p class="total">Total: $${bookingData.quote.total.toFixed(2)}</p>
            </div>
            
            <div class="booking-details">
              <h3>📞 Next Steps</h3>
              <p>1. <strong>Print the attached PDF</strong> - You'll need this for your move day</p>
              <p>2. <strong>Review the inventory checklist</strong> - Ensure all items are listed correctly</p>
              <p>3. <strong>Prepare for your move</strong> - We'll contact you 24 hours before to confirm details</p>
              <p>4. <strong>Have the document ready</strong> - Our team will use it for pickup and delivery verification</p>
            </div>
            
            <p>We'll contact you 24 hours before your move to confirm details and provide our team's contact information.</p>
          </div>
          
           <div class="footer">
             <p>Thank you for choosing NextMovement!</p>
             <p>Need help? Contact us at (438) 543-0904 or mouvementsuivant@outlook.com</p>
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