import jsPDF from 'jspdf';

interface Address {
  id: string;
  address: string;
  type: 'pickup' | 'dropoff';
}

interface Item {
  id: string;
  name: string;
  category: string;
  weight: number;
  volume: number;
  quantity: number;
}

interface ServiceTier {
  id: string;
  name: string;
  price: number;
  priceUnit: string;
}

interface QuoteData {
  baseServiceFee: number;
  itemCost: number;
  distanceFee: number;
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
}

interface PaymentData {
  fullName: string;
  email: string;
  phone: string;
  billingAddress: string;
  billingCity: string;
  billingPostal: string;
}

interface BookingData {
  date: Date;
  time: string;
  addresses: Address[];
  serviceTier: ServiceTier;
  items: Item[];
  quote: QuoteData;
  paymentData: PaymentData;
}

const timeSlotLabels: Record<string, string> = {
  '8-10': '8:00 AM - 10:00 AM',
  '10-12': '10:00 AM - 12:00 PM',
  '12-14': '12:00 PM - 2:00 PM',
  '14-16': '2:00 PM - 4:00 PM',
  '16-18': '4:00 PM - 6:00 PM',
  '18-20': '6:00 PM - 8:00 PM'
};

export const generateBookingPDF = (bookingData: BookingData, bookingId: string): Promise<Blob> => {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Helper function to add text with automatic line breaks
    const addText = (text: string, x: number, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, x, yPosition);
      yPosition += lines.length * (fontSize * 0.5) + 5;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    };
    
    // Header
    addText('NEXTMOVEMENT MOVING SERVICES', 20, 18, true);
    addText('Booking Confirmation & Inventory Checklist', 20, 14, true);
    yPosition += 10;
    
    // Booking ID and Date
    addText(`Booking ID: ${bookingId}`, 20, 12, true);
    addText(`Generated: ${new Date().toLocaleDateString('en-CA')} at ${new Date().toLocaleTimeString('en-CA', { hour12: false })}`, 20);
    yPosition += 10;
    
    // Move Details
    addText('MOVE DETAILS', 20, 14, true);
    addText(`Date: ${bookingData.date.toLocaleDateString('en-CA')}`, 20);
    addText(`Time: ${timeSlotLabels[bookingData.time] || bookingData.time}`, 20);
    addText(`Service: ${bookingData.serviceTier.name}`, 20);
    yPosition += 5;
    
    // Addresses
    addText('ADDRESSES', 20, 14, true);
    const pickupAddress = bookingData.addresses.find(addr => addr.type === 'pickup');
    const dropoffAddresses = bookingData.addresses.filter(addr => addr.type === 'dropoff');
    
    if (pickupAddress) {
      addText(`Pickup: ${pickupAddress.address}`, 20);
    }
    
    dropoffAddresses.forEach((addr, index) => {
      addText(`Drop-off ${index + 1}: ${addr.address}`, 20);
    });
    yPosition += 5;
    
    // Customer Information
    addText('CUSTOMER INFORMATION', 20, 14, true);
    addText(`Name: ${bookingData.paymentData.fullName}`, 20);
    addText(`Email: ${bookingData.paymentData.email}`, 20);
    addText(`Phone: ${bookingData.paymentData.phone}`, 20);
    addText(`Billing Address: ${bookingData.paymentData.billingAddress}, ${bookingData.paymentData.billingCity}, ${bookingData.paymentData.billingPostal}`, 20);
    yPosition += 10;
    
    // Items Inventory Checklist
    addText('ITEMS INVENTORY CHECKLIST', 20, 14, true);
    addText('Please check off each item during pickup and delivery:', 20, 10);
    yPosition += 5;
    
    // Group items by category
    const itemsByCategory = bookingData.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, Item[]>);
    
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      addText(category.toUpperCase(), 20, 12, true);
      
      items.forEach(item => {
        const itemText = `☐ ${item.name} (Qty: ${item.quantity}) - Weight: ${item.weight}kg, Volume: ${item.volume}m³`;
        addText(itemText, 25, 10);
      });
      yPosition += 3;
    });
    
    // Calculate totals
    const totalWeight = bookingData.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalVolume = bookingData.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    const totalItems = bookingData.items.reduce((sum, item) => sum + item.quantity, 0);
    
    yPosition += 5;
    addText('INVENTORY SUMMARY', 20, 12, true);
    addText(`Total Items: ${totalItems}`, 20);
    addText(`Total Weight: ${totalWeight.toFixed(2)} kg`, 20);
    addText(`Total Volume: ${totalVolume.toFixed(2)} m³`, 20);
    yPosition += 10;
    
    // Quote Details
    addText('PRICING BREAKDOWN', 20, 14, true);
    addText(`Base Service Fee: $${bookingData.quote.baseServiceFee.toFixed(2)}`, 20);
    addText(`Item Cost: $${bookingData.quote.itemCost.toFixed(2)}`, 20);
    addText(`Distance Fee: $${bookingData.quote.distanceFee.toFixed(2)}`, 20);
    addText(`Subtotal: $${bookingData.quote.subtotal.toFixed(2)}`, 20);
    addText(`GST (5%): $${bookingData.quote.gst.toFixed(2)}`, 20);
    addText(`QST (9.975%): $${bookingData.quote.qst.toFixed(2)}`, 20);
    addText(`Total: $${bookingData.quote.total.toFixed(2)}`, 20, 12, true);
    yPosition += 10;
    
    // Signature sections
    addText('SIGNATURES', 20, 14, true);
    addText('Customer Signature (Pickup): _________________________ Date: _________', 20);
    yPosition += 10;
    addText('Customer Signature (Delivery): _________________________ Date: _________', 20);
    yPosition += 10;
    addText('Driver Signature: _________________________ Date: _________', 20);
    yPosition += 15;
    
    // Footer
    addText('Thank you for choosing NextMovement Moving Services!', 20, 10);
    addText('For questions or concerns, please contact us at support@nextmovement.ca', 20, 10);
    
    // Convert to blob and resolve
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};