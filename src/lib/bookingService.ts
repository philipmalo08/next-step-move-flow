import { supabase } from "@/integrations/supabase/client";
import { getUserIdentifier } from "./sessionManager";
import { paymentDataSchema } from "./validation";
import { generateBookingPDF } from "./pdfGenerator";

export interface BookingData {
  date: Date;
  time: string;
  addresses: Array<{
    id: string;
    address: string;
    type: 'pickup' | 'dropoff';
    components?: any[]; // Google address components
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
  user_id: string; // Now TEXT to support both auth UUIDs and session IDs
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
    billingAddress: string;
  };
  status: 'confirmed' | 'pending' | 'cancelled';
}

export const saveBooking = async (bookingData: BookingData, userId?: string, distance?: number, language: 'en' | 'fr' = 'en'): Promise<string> => {
  try {
    console.log("Starting saveBooking with userId:", userId);
    
    // Validate and sanitize payment data
    const validatedPaymentData = paymentDataSchema.parse(bookingData.paymentData);
    
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
    const finalUserId = userId || await getUserIdentifier();
    
    const bookingRecord = {
      booking_id: bookingId,
      user_id: finalUserId,
      
      // Personal information (using validated data)
      customer_name: validatedPaymentData.fullName,
      customer_email: validatedPaymentData.email,
      customer_phone: validatedPaymentData.phone,
      
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
      
      // Payment details summary (using validated data)
      payment_details_summary: {
        fullName: validatedPaymentData.fullName,
        email: validatedPaymentData.email,
        phone: validatedPaymentData.phone,
        billingAddress: validatedPaymentData.billingAddress,
      },
      
      // Metadata
      status: 'confirmed'
    };

    if (!finalUserId || finalUserId.trim() === '') {
      throw new Error("Valid user session required to save booking");
    }

    console.log("Attempting to save booking with user_id:", finalUserId);
    
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
    
    // Send confirmation email with language support
    try {
      await sendBookingConfirmationEmail(bookingData, bookingId, language);
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

const sendBookingConfirmationEmail = async (bookingData: BookingData, bookingId: string, language: 'en' | 'fr' = 'en') => {
  try {
    // Generate PDF with language support
    const pdfBlob = await generateBookingPDF(bookingData, bookingId, language);
    
    // Convert PDF blob to base64 for email attachment
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(String.fromCharCode(...uint8Array));

    // Use the new PDF-enabled email function with language support
    const { error } = await supabase.functions.invoke('send-booking-confirmation', {
      body: {
        bookingData,
        bookingId,
        pdfBuffer: base64String,
        language
      }
    });

    if (error) {
      throw new Error(`Failed to send email with PDF: ${error.message}`);
    }
  } catch (error) {
    console.error("Error generating PDF or sending email:", error);
    // Fall back to basic email without PDF
    const { error: fallbackError } = await supabase.functions.invoke('send-email', {
      body: {
        to: bookingData.paymentData.email,
        subject: `Booking Confirmation - ${bookingId}`,
        html: `
          <h1>Booking Confirmed!</h1>
          <p>Hello ${bookingData.paymentData.fullName},</p>
          <p>Your booking has been confirmed with ID: ${bookingId}</p>
          <p>Date: ${bookingData.date.toLocaleDateString()}</p>
          <p>Total: $${bookingData.quote.total.toFixed(2)}</p>
          <p>Thank you for choosing NextMovement!</p>
        `
      }
    });
    
    if (fallbackError) {
      throw new Error(`Failed to send fallback email: ${fallbackError.message}`);
    }
  }
};