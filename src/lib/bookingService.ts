import { supabase } from "@/integrations/supabase/client";

export interface BookingData {
  date: Date;
  time: string;
  addresses: Array<{
    id: string;
    address: string;
    type: 'pickup' | 'dropoff';
  }>;
  serviceTier: {
    id: string;
    name: string;
    price: number;
    priceUnit: string;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    weight: number;
    volume: number;
    quantity: number;
  }>;
  quote: {
    baseServiceFee: number;
    itemCost: number;
    distanceFee: number;
    subtotal: number;
    gst: number;
    qst: number;
    total: number;
  };
  paymentData: {
    fullName: string;
    email: string;
    phone: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
    billingAddress: string;
    billingCity: string;
    billingPostal: string;
  };
  // Additional fields for storage
  calculatedDistance?: number;
  estimatedTotalVolume?: number;
  estimatedTotalWeight?: number;
  customItems?: Array<{
    name: string;
    category: string;
    weight: number;
    volume: number;
    quantity: number;
  }>;
}

// Simplified interface for Supabase storage
export interface SupabaseBookingData {
  booking_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pickup_addresses: string[];
  dropoff_addresses: string[];
  service_tier: string;
  service_price: number;
  selected_items: Record<string, number>;
  custom_items: Array<{
    name: string;
    category: string;
    weight: number;
    volume: number;
    quantity: number;
  }>;
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
  final_quote_amount: number;
  calculated_distance?: string;
  estimated_total_weight?: number;
  estimated_total_volume?: number;
  payment_details_summary: {
    fullName: string;
    email: string;
    phone: string;
    cardholderName: string;
    billingAddress: string;
    last4: string;
  };
  status: 'confirmed' | 'pending' | 'cancelled';
}

export const saveBooking = async (bookingData: BookingData, userId?: string, distance?: number): Promise<string> => {
  try {
    console.log("Starting saveBooking with userId:", userId);
    
    // Generate a unique booking ID
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Calculate totals
    const totalWeight = bookingData.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalVolume = bookingData.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    
    // Create selectedItems map (item name -> quantity)
    const selectedItems: Record<string, number> = {};
    bookingData.items.forEach(item => {
      if (item.category !== 'Custom') {
        selectedItems[item.name] = item.quantity;
      }
    });
    
    // Extract custom items
    const customItems = bookingData.items
      .filter(item => item.category === 'Custom')
      .map(item => ({
        name: item.name,
        category: item.category,
        weight: item.weight,
        volume: item.volume,
        quantity: item.quantity
      }));
    
    // Prepare data for Supabase storage
    const bookingRecord = {
      booking_id: bookingId,
      user_id: userId || '',
      
      // Personal information
      customer_name: bookingData.paymentData.fullName,
      customer_email: bookingData.paymentData.email,
      customer_phone: bookingData.paymentData.phone,
      
      // Booking details
      booking_date: bookingData.date.toISOString().split('T')[0], // Convert to date string
      booking_time: bookingData.time,
      pickup_addresses: bookingData.addresses.filter(addr => addr.type === 'pickup').map(addr => addr.address),
      dropoff_addresses: bookingData.addresses.filter(addr => addr.type === 'dropoff').map(addr => addr.address),
      
      // Service details
      service_tier: bookingData.serviceTier.name,
      service_price: bookingData.serviceTier.price,
      
      // Items
      selected_items: selectedItems,
      custom_items: customItems,
      
      // Quote details
      subtotal: bookingData.quote.subtotal,
      gst: bookingData.quote.gst,
      qst: bookingData.quote.qst,
      total: bookingData.quote.total,
      final_quote_amount: bookingData.quote.total,
      
      // Distance and calculations
      calculated_distance: (distance || bookingData.calculatedDistance || 0).toString(),
      estimated_total_weight: totalWeight,
      estimated_total_volume: totalVolume,
      
      // Payment details summary (without sensitive card details)
      payment_details_summary: {
        fullName: bookingData.paymentData.fullName,
        email: bookingData.paymentData.email,
        phone: bookingData.paymentData.phone,
        cardholderName: bookingData.paymentData.cardholderName,
        billingAddress: bookingData.paymentData.billingAddress,
        last4: bookingData.paymentData.cardNumber.slice(-4)
      },
      
      // Metadata
      status: 'confirmed'
    };

    if (!userId) {
      throw new Error("User must be authenticated to save booking");
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingRecord])
      .select()
      .single();
    
    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Failed to save booking: ${error.message}`);
    }
    
    console.log("Booking saved successfully with ID:", data.id);
    
    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(bookingData, bookingId);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the booking if email fails
    }
    
    return data.id;
  } catch (error) {
    console.error("Error saving booking:", error);
    throw new Error("Failed to save booking data");
  }
};

const sendBookingConfirmationEmail = async (bookingData: BookingData, bookingId: string) => {
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚛 Booking Confirmed!</h1>
          <p>Thank you for choosing Next Movement</p>
        </div>
        
        <div class="content">
          <h2>Hello ${bookingData.paymentData.fullName}!</h2>
          <p>Your moving booking has been confirmed. Here are the details:</p>
          
          <div class="booking-details">
            <h3>📋 Booking Information</h3>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Date:</strong> ${bookingData.date.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${bookingData.time}</p>
            <p><strong>Service:</strong> ${bookingData.serviceTier.name}</p>
          </div>
          
          <div class="booking-details">
            <h3>📍 Addresses</h3>
            <p><strong>Pickup:</strong></p>
            ${bookingData.addresses.filter(addr => addr.type === 'pickup').map(addr => `<p>• ${addr.address}</p>`).join('')}
            <p><strong>Drop-off:</strong></p>
            ${bookingData.addresses.filter(addr => addr.type === 'dropoff').map(addr => `<p>• ${addr.address}</p>`).join('')}
          </div>
          
          <div class="booking-details">
            <h3>📦 Items</h3>
            ${bookingData.items.map(item => `<p>• ${item.name} (${item.quantity}x)</p>`).join('')}
          </div>
          
          <div class="booking-details">
            <h3>💰 Payment Summary</h3>
            <p>Subtotal: $${bookingData.quote.subtotal.toFixed(2)}</p>
            <p>GST: $${bookingData.quote.gst.toFixed(2)}</p>
            <p>QST: $${bookingData.quote.qst.toFixed(2)}</p>
            <p class="total">Total: $${bookingData.quote.total.toFixed(2)}</p>
          </div>
          
          <div class="booking-details">
            <h3>📞 Contact Information</h3>
            <p><strong>Phone:</strong> ${bookingData.paymentData.phone}</p>
            <p><strong>Email:</strong> ${bookingData.paymentData.email}</p>
          </div>
          
          <p>We'll contact you 24 hours before your move to confirm details and provide our team's contact information.</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Next Movement!</p>
          <p>Need help? Contact us at support@nextmovement.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: bookingData.paymentData.email,
      subject: `Booking Confirmation - ${bookingId}`,
      html: emailHtml
    }
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};