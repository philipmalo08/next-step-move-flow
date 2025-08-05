import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteEmailRequest {
  to: string;
  quote: {
    baseServiceFee: number;
    itemCost: number;
    distanceFee: number;
    subtotal: number;
    gst: number;
    qst: number;
    total: number;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    weight: number;
    volume: number;
    quantity: number;
  }>;
  serviceTier: {
    id: string;
    name: string;
    price: number;
    priceUnit: string;
  };
  distance: number;
  language?: 'en' | 'fr';
}

const emailTranslations = {
  en: {
    subject: 'Your Moving Quote from Next Movement',
    title: 'Your Moving Quote',
    subtitle: 'Thank you for requesting a quote! Here are the details:',
    breakdown: 'Quote Breakdown',
    baseService: 'Base Service Fee',
    itemCost: 'Items Cost',
    distanceFee: 'Distance Fee',
    subtotal: 'Subtotal',
    gst: 'GST (5%)',
    qst: 'QST (9.975%)',
    total: 'Total',
    selectedService: 'Selected Service',
    itemsSummary: 'Items Summary',
    items: 'Items',
    distance: 'Distance',
    whatsIncluded: 'What\'s Included',
    included1: 'Professional loading and unloading',
    included2: 'Basic equipment and tools',
    included3: 'Transport between locations',
    included4: 'Careful handling of your items',
    included5: 'Basic liability protection',
    included6: 'Insurance coverage',
    footer: 'Contact us to book your move or if you have any questions.',
    contact: 'Contact: mouvementsuivant@outlook.com',
  },
  fr: {
    subject: 'Votre devis de déménagement de Next Movement',
    title: 'Votre devis de déménagement',
    subtitle: 'Merci d\'avoir demandé un devis! Voici les détails:',
    breakdown: 'Détail du devis',
    baseService: 'Frais de service de base',
    itemCost: 'Coût des articles',
    distanceFee: 'Frais de distance',
    subtotal: 'Sous-total',
    gst: 'TPS (5%)',
    qst: 'TVQ (9.975%)',
    total: 'Total',
    selectedService: 'Service sélectionné',
    itemsSummary: 'Résumé des articles',
    items: 'Articles',
    distance: 'Distance',
    whatsIncluded: 'Ce qui est inclus',
    included1: 'Chargement et déchargement professionnel',
    included2: 'Équipement et outils de base',
    included3: 'Transport entre les lieux',
    included4: 'Manipulation soigneuse de vos articles',
    included5: 'Protection de responsabilité de base',
    included6: 'Couverture d\'assurance',
    footer: 'Contactez-nous pour réserver votre déménagement ou si vous avez des questions.',
    contact: 'Contact: mouvementsuivant@outlook.com',
  }
};

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

    const { to, quote, items, serviceTier, distance, language = 'en' }: QuoteEmailRequest = await req.json();
    const t = emailTranslations[language];

    const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const logoImage = language === 'fr' 
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/mouvementsuivant-final1.PNG'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/nextmovement-final.PNG';
    
    const bottomImage = language === 'fr'
      ? 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/Mouvement Suivant Soumission Courriel.png'
      : 'https://eqqggvtodrgbboebvglh.supabase.co/storage/v1/object/public/assets/Next Movement Quote Email.png';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
            .quote-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3B82F6; }
            .quote-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .quote-row:last-child { border-bottom: none; }
            .total-row { font-weight: bold; font-size: 1.2em; color: #3B82F6; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; margin: 15px 0; }
            .summary-item { background: white; padding: 15px; border-radius: 8px; }
            .summary-number { font-size: 1.5em; font-weight: bold; color: #3B82F6; }
            .included-list { background: white; padding: 20px; border-radius: 8px; }
            .included-item { padding: 5px 0; }
            .footer { text-align: center; color: #666; margin-top: 30px; }
            .contact { background: #3B82F6; color: white; padding: 15px; text-align: center; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t.title}</h1>
            <p>${t.subtitle}</p>
          </div>

          <div class="quote-section">
            <h3>${t.breakdown}</h3>
            <div class="quote-row">
              <span>${t.baseService}</span>
              <span>$${quote.baseServiceFee.toFixed(2)}</span>
            </div>
            <div class="quote-row">
              <span>${t.itemCost} (${totalWeight} lbs)</span>
              <span>$${quote.itemCost.toFixed(2)}</span>
            </div>
            <div class="quote-row">
              <span>${t.distanceFee} (${distance.toFixed(1)} km)</span>
              <span>$${quote.distanceFee.toFixed(2)}</span>
            </div>
            <div class="quote-row">
              <span>${t.subtotal}</span>
              <span>$${quote.subtotal.toFixed(2)}</span>
            </div>
            <div class="quote-row">
              <span>${t.gst}</span>
              <span>$${quote.gst.toFixed(2)}</span>
            </div>
            <div class="quote-row">
              <span>${t.qst}</span>
              <span>$${quote.qst.toFixed(2)}</span>
            </div>
            <div class="quote-row total-row">
              <span>${t.total}</span>
              <span>$${quote.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="content">
            <h3>${t.selectedService}</h3>
            <p style="color: #3B82F6; font-weight: bold; font-size: 1.1em;">${serviceTier.name}</p>
            
            <h3>${t.itemsSummary}</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-number">${totalItems}</div>
                <div>${t.items}</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${totalWeight.toLocaleString()}</div>
                <div>lbs</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${totalVolume.toFixed(1)}</div>
                <div>ft³</div>
              </div>
            </div>

            <h3>${t.distance}</h3>
            <p style="color: #3B82F6; font-weight: bold; font-size: 1.2em;">${distance.toFixed(1)} km</p>
          </div>

          <div class="included-list">
            <h3>${t.whatsIncluded}</h3>
            <div class="included-item">✓ ${t.included1}</div>
            <div class="included-item">✓ ${t.included2}</div>
            <div class="included-item">✓ ${t.included3}</div>
            <div class="included-item">✓ ${t.included4}</div>
            <div class="included-item">✓ ${t.included5}</div>
            <div class="included-item">✓ ${t.included6}</div>
          </div>

          <div class="contact">
            <p>${t.footer}</p>
            <p><strong>${t.contact}</strong></p>
          </div>

          <div class="footer">
            <p>&copy; 2024 Next Movement. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: t.subject
        }
      ],
      from: { email: "mouvementsuivant@outlook.com", name: "Next Movement" },
      content: [
        {
          type: 'text/html',
          value: html
        }
      ]
    };

    console.log('Sending quote email to:', to);

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

    console.log('Quote email sent successfully');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-quote-email function:', error);
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