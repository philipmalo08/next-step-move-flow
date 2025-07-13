import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

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
}

export interface StoredBookingData {
  // Personal information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Booking details
  bookingDate: Date;
  bookingTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  
  // Service details
  serviceTier: string;
  servicePrice: number;
  
  // Items (simplified for storage)
  items: Array<{
    name: string;
    category: string;
    weight: number;
    volume: number;
    quantity: number;
  }>;
  
  // Quote details
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
  
  // Billing information
  billingAddress: {
    street: string;
    city: string;
    postal: string;
  };
  
  // Metadata
  createdAt: any; // serverTimestamp
  status: 'confirmed' | 'pending' | 'cancelled';
  bookingId: string;
}

export const saveBooking = async (bookingData: BookingData, userId?: string): Promise<string> => {
  try {
    // Generate a unique booking ID
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Prepare data for storage according to Firestore rules
    const storedBooking: StoredBookingData = {
      // Personal information
      customerName: bookingData.paymentData.fullName,
      customerEmail: bookingData.paymentData.email,
      customerPhone: bookingData.paymentData.phone,
      
      // Booking details
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
      pickupAddress: bookingData.addresses.find(addr => addr.type === 'pickup')?.address || '',
      dropoffAddress: bookingData.addresses.find(addr => addr.type === 'dropoff')?.address || '',
      
      // Service details
      serviceTier: bookingData.serviceTier.name,
      servicePrice: bookingData.serviceTier.price,
      
      // Items
      items: bookingData.items.map(item => ({
        name: item.name,
        category: item.category,
        weight: item.weight,
        volume: item.volume,
        quantity: item.quantity
      })),
      
      // Quote details
      subtotal: bookingData.quote.subtotal,
      gst: bookingData.quote.gst,
      qst: bookingData.quote.qst,
      total: bookingData.quote.total,
      
      // Billing information (without sensitive card details)
      billingAddress: {
        street: bookingData.paymentData.billingAddress,
        city: bookingData.paymentData.billingCity,
        postal: bookingData.paymentData.billingPostal
      },
      
      // Metadata
      createdAt: serverTimestamp(),
      status: 'confirmed',
      bookingId: bookingId
    };

    // Use the Firestore path according to your rules
    const appId = "next-movement-app"; // Your app identifier
    const actualUserId = userId || "guest"; // Use guest if no userId provided
    
    const bookingsCollection = collection(db, `artifacts/${appId}/users/${actualUserId}/bookings`);
    const docRef = await addDoc(bookingsCollection, storedBooking);
    
    console.log("Booking saved successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving booking:", error);
    throw new Error("Failed to save booking data");
  }
};