import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

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

export interface StoredBookingData {
  // Personal information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Booking details
  bookingDate: Date;
  bookingTime: string;
  pickupAddresses: string[];
  dropoffAddresses: string[];
  
  // Service details
  serviceTier: string;
  servicePrice: number;
  
  // Items (simplified for storage)
  selectedItems: Record<string, number>; // item name -> quantity
  customItems: Array<{
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
  finalQuoteAmount: number;
  
  // Distance and volume calculations
  calculatedDistance: string;
  estimatedTotalWeight: number;
  estimatedTotalVolume: number;
  
  // Payment details summary (no sensitive card info)
  paymentDetailsSummary: {
    fullName: string;
    email: string;
    phone: string;
    cardholderName: string;
    billingAddress: string;
    last4: string;
  };
  
  // Metadata
  timestamp: any; // serverTimestamp
  status: 'confirmed' | 'pending' | 'cancelled';
  bookingId: string;
  userId: string;
}

export const saveBooking = async (bookingData: BookingData, userId?: string, distance?: number): Promise<string> => {
  try {
    console.log("Starting saveBooking with userId:", userId);
    console.log("Current auth user:", auth.currentUser?.uid);
    
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
    
    // Prepare data for storage according to Firestore rules
    const storedBooking: StoredBookingData = {
      // Personal information
      customerName: bookingData.paymentData.fullName,
      customerEmail: bookingData.paymentData.email,
      customerPhone: bookingData.paymentData.phone,
      
      // Booking details
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
      pickupAddresses: bookingData.addresses.filter(addr => addr.type === 'pickup').map(addr => addr.address),
      dropoffAddresses: bookingData.addresses.filter(addr => addr.type === 'dropoff').map(addr => addr.address),
      
      // Service details
      serviceTier: bookingData.serviceTier.name,
      servicePrice: bookingData.serviceTier.price,
      
      // Items
      selectedItems: selectedItems,
      customItems: customItems,
      
      // Quote details
      subtotal: bookingData.quote.subtotal,
      gst: bookingData.quote.gst,
      qst: bookingData.quote.qst,
      total: bookingData.quote.total,
      finalQuoteAmount: bookingData.quote.total,
      
      // Distance and calculations
      calculatedDistance: (distance || bookingData.calculatedDistance || 0).toString(),
      estimatedTotalWeight: totalWeight,
      estimatedTotalVolume: totalVolume,
      
      // Payment details summary (without sensitive card details)
      paymentDetailsSummary: {
        fullName: bookingData.paymentData.fullName,
        email: bookingData.paymentData.email,
        phone: bookingData.paymentData.phone,
        cardholderName: bookingData.paymentData.cardholderName,
        billingAddress: bookingData.paymentData.billingAddress,
        last4: bookingData.paymentData.cardNumber.slice(-4)
      },
      
      // Metadata
      timestamp: serverTimestamp(),
      status: 'confirmed',
      bookingId: bookingId,
      userId: userId || ''
    };

    // Use the Firestore path according to your rules
    const appId = "next-movement-app"; // Your app identifier
    
    if (!userId) {
      throw new Error("User must be authenticated to save booking");
    }
    
    const bookingsCollection = collection(db, `artifacts/${appId}/users/${userId}/bookings`);
    const docRef = await addDoc(bookingsCollection, storedBooking);
    
    console.log("Booking saved successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving booking:", error);
    throw new Error("Failed to save booking data");
  }
};