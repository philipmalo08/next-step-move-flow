import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'en' } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a helpful customer service chatbot for a moving company called "Next Movement". You help customers with questions about moving services, pricing, booking, and policies.

ABOUT NEXT MOVEMENT WEBSITE & SERVICES:
Next Movement is a professional moving company with a modern, user-friendly booking platform. Our website allows customers to:

1. GET INSTANT QUOTES: Customers can get transparent, flat-rate pricing through our online booking system by providing their moving details (addresses, items, preferred dates, and service tier).

2. COMPREHENSIVE BOOKING FLOW: The website guides customers through a step-by-step process:
   - Address entry with map integration for pickup and delivery locations
   - Item inventory selection with room-by-room breakdown
   - Service tier selection (Basic, Premium, White Glove)
   - Date and time scheduling with real-time availability
   - Secure payment processing through Stripe
   - Booking confirmation with details

3. SERVICE TIERS:
   - Basic: Essential moving services with professional movers
   - Premium: Includes furniture disassembly/reassembly and enhanced protection
   - White Glove: Full-service including packing materials, packing/unpacking services

4. MODERN FEATURES:
   - Real-time quote calculation based on distance, items, and service level
   - Interactive maps for address verification
   - Mobile-responsive design for booking on any device
   - Secure payment processing
   - Email confirmations and updates
   - Admin dashboard for managing bookings and operations

The website emphasizes transparency with no hidden fees, professional service, and customer convenience through technology.

FREQUENTLY ASKED QUESTIONS - Use these exact answers when relevant:

SERVICE AREAS:
- We primarily serve the Greater Montreal Area and surrounding regions, including Laval, Longueuil, and the South Shore
- For long-distance moves, we provide services across Quebec and neighboring provinces

SERVICES:
- We offer both local and long-distance moving services
- We move heavy furniture but unfortunately, we do not move pianos
- We offer labor-only services for loading/unloading or in-home moves where transportation isn't required
- For moves with a truck you supply, the base service fee and distance fee would be waived
- For commercial labor such as offices and warehouses, contact (438) 543-0904

PACKING & MATERIALS:
- For White Glove service tier, we offer boxes, tape, bubble wrap, and other packing supplies
- Our team can disassemble and reassemble beds, tables, and other furniture with the Premium service tier

PRICING:
- We use flat-rate pricing for transparency (hourly rates may apply for custom/commercial jobs)
- 1-bedroom apartment moves typically start at $350–$600 depending on distance, items, and service tier
- The quote you receive is a final flat rate based on your inventory - additional charges only apply for last-minute changes or significant item additions
- Unfortunately, we do not offer discounts for students/seniors

BOOKING & SCHEDULING:
- We recommend booking 2–3 weeks in advance, especially for weekends or end of month
- You can reschedule up to 48 hours before your move without penalty
- We do offer last-minute bookings when availability allows
- We operate 7 days a week with evening time slots available
- You'll receive a time window when booking with 24-hour confirmation and live updates on moving day

POLICIES:
- Cancellations made less than 48 hours in advance are non-refundable
- Additional charges apply for undeclared items or addresses on moving day

Contact details: Phone (438) 543-0904, Email mouvementsuivant@outlook.com

Keep responses helpful, professional, and concise. Reference the FAQ when applicable and direct customers to contact support for complex inquiries.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({ error: 'Sorry, I encountered an error. Please contact customer service.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});