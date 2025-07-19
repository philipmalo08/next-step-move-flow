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

// PDF Translations
const pdfTranslations = {
  en: {
    title: 'NEXTMOVEMENT MOVING SERVICES',
    subtitle: 'Booking Confirmation & Inventory Checklist',
    bookingId: 'Booking ID',
    generated: 'Generated',
    moveDetails: 'MOVE DETAILS',
    date: 'Date',
    time: 'Time',
    service: 'Service',
    addresses: 'ADDRESSES',
    pickup: 'Pickup',
    dropoff: 'Drop-off',
    customerInfo: 'CUSTOMER INFORMATION',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    billingAddress: 'Billing Address',
    inventoryChecklist: 'ITEMS INVENTORY CHECKLIST',
    checklistInstructions: 'Please check off each item during pickup and delivery:',
    inventorySummary: 'INVENTORY SUMMARY',
    totalItems: 'Total Items',
    totalWeight: 'Total Weight',
    totalVolume: 'Total Volume',
    pricingBreakdown: 'PRICING BREAKDOWN',
    baseServiceFee: 'Base Service Fee',
    itemCost: 'Item Cost',
    distanceFee: 'Distance Fee',
    subtotal: 'Subtotal',
    gst: 'GST (5%)',
    qst: 'QST (9.975%)',
    total: 'Total',
    signatures: 'SIGNATURES',
    customerSignaturePickup: 'Customer Signature (Pickup): _________________________ Date: _________',
    customerSignatureDelivery: 'Customer Signature (Delivery): _________________________ Date: _________',
    driverSignature: 'Driver Signature: _________________________ Date: _________',
    thankYou: 'Thank you for choosing NextMovement Moving Services!',
    contact: 'For questions or concerns, please contact us at support@nextmovement.ca',
    quantity: 'Qty',
    weight: 'Weight',
    volume: 'Volume'
  },
  fr: {
    title: 'SERVICES DE DÉMÉNAGEMENT NEXTMOVEMENT',
    subtitle: 'Confirmation de Réservation et Liste de Vérification d\'Inventaire',
    bookingId: 'ID de Réservation',
    generated: 'Généré',
    moveDetails: 'DÉTAILS DU DÉMÉNAGEMENT',
    date: 'Date',
    time: 'Heure',
    service: 'Service',
    addresses: 'ADRESSES',
    pickup: 'Ramassage',
    dropoff: 'Livraison',
    customerInfo: 'INFORMATIONS CLIENT',
    name: 'Nom',
    email: 'E-mail',
    phone: 'Téléphone',
    billingAddress: 'Adresse de Facturation',
    inventoryChecklist: 'LISTE DE VÉRIFICATION D\'INVENTAIRE',
    checklistInstructions: 'Veuillez cocher chaque article lors du ramassage et de la livraison:',
    inventorySummary: 'RÉSUMÉ DE L\'INVENTAIRE',
    totalItems: 'Total des Articles',
    totalWeight: 'Poids Total',
    totalVolume: 'Volume Total',
    pricingBreakdown: 'DÉTAIL DES PRIX',
    baseServiceFee: 'Frais de Service de Base',
    itemCost: 'Coût des Articles',
    distanceFee: 'Frais de Distance',
    subtotal: 'Sous-total',
    gst: 'TPS (5%)',
    qst: 'TVQ (9.975%)',
    total: 'Total',
    signatures: 'SIGNATURES',
    customerSignaturePickup: 'Signature Client (Ramassage): _________________________ Date: _________',
    customerSignatureDelivery: 'Signature Client (Livraison): _________________________ Date: _________',
    driverSignature: 'Signature Chauffeur: _________________________ Date: _________',
    thankYou: 'Merci d\'avoir choisi les Services de Déménagement NextMovement!',
    contact: 'Pour questions ou préoccupations, contactez-nous à support@nextmovement.ca',
    quantity: 'Qté',
    weight: 'Poids',
    volume: 'Volume'
  }
};

const timeSlotLabels: Record<string, Record<string, string>> = {
  en: {
    '8-10': '8:00 AM - 10:00 AM',
    '10-12': '10:00 AM - 12:00 PM',
    '12-14': '12:00 PM - 2:00 PM',
    '14-16': '2:00 PM - 4:00 PM',
    '16-18': '4:00 PM - 6:00 PM',
    '18-20': '6:00 PM - 8:00 PM'
  },
  fr: {
    '8-10': '8h00 - 10h00',
    '10-12': '10h00 - 12h00',
    '12-14': '12h00 - 14h00',
    '14-16': '14h00 - 16h00',
    '16-18': '16h00 - 18h00',
    '18-20': '18h00 - 20h00'
  }
};

export const generateBookingPDF = (bookingData: BookingData, bookingId: string, language: 'en' | 'fr' = 'en'): Promise<Blob> => {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    const t = pdfTranslations[language];
    const timeLabels = timeSlotLabels[language];
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
    addText(t.title, 20, 18, true);
    addText(t.subtitle, 20, 14, true);
    yPosition += 10;
    
    // Booking ID and Date
    addText(`${t.bookingId}: ${bookingId}`, 20, 12, true);
    const dateStr = language === 'fr' 
      ? new Date().toLocaleDateString('fr-CA') 
      : new Date().toLocaleDateString('en-CA');
    const timeStr = new Date().toLocaleTimeString(language === 'fr' ? 'fr-CA' : 'en-CA', { hour12: false });
    addText(`${t.generated}: ${dateStr} à ${timeStr}`, 20);
    yPosition += 10;
    
    // Move Details
    addText(t.moveDetails, 20, 14, true);
    const moveDate = language === 'fr' 
      ? bookingData.date.toLocaleDateString('fr-CA')
      : bookingData.date.toLocaleDateString('en-CA');
    addText(`${t.date}: ${moveDate}`, 20);
    addText(`${t.time}: ${timeLabels[bookingData.time] || bookingData.time}`, 20);
    addText(`${t.service}: ${bookingData.serviceTier.name}`, 20);
    yPosition += 5;
    
    // Addresses
    addText(t.addresses, 20, 14, true);
    const pickupAddress = bookingData.addresses.find(addr => addr.type === 'pickup');
    const dropoffAddresses = bookingData.addresses.filter(addr => addr.type === 'dropoff');
    
    if (pickupAddress) {
      addText(`${t.pickup}: ${pickupAddress.address}`, 20);
    }
    
    dropoffAddresses.forEach((addr, index) => {
      addText(`${t.dropoff} ${index + 1}: ${addr.address}`, 20);
    });
    yPosition += 5;
    
    // Customer Information
    addText(t.customerInfo, 20, 14, true);
    addText(`${t.name}: ${bookingData.paymentData.fullName}`, 20);
    addText(`${t.email}: ${bookingData.paymentData.email}`, 20);
    addText(`${t.phone}: ${bookingData.paymentData.phone}`, 20);
    addText(`${t.billingAddress}: ${bookingData.paymentData.billingAddress}, ${bookingData.paymentData.billingCity}, ${bookingData.paymentData.billingPostal}`, 20);
    yPosition += 10;
    
    // Items Inventory Checklist
    addText(t.inventoryChecklist, 20, 14, true);
    addText(t.checklistInstructions, 20, 10);
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
        const itemText = `☐ ${item.name} (${t.quantity}: ${item.quantity}) - ${t.weight}: ${item.weight}kg, ${t.volume}: ${item.volume}m³`;
        addText(itemText, 25, 10);
      });
      yPosition += 3;
    });
    
    // Calculate totals
    const totalWeight = bookingData.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalVolume = bookingData.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    const totalItems = bookingData.items.reduce((sum, item) => sum + item.quantity, 0);
    
    yPosition += 5;
    addText(t.inventorySummary, 20, 12, true);
    addText(`${t.totalItems}: ${totalItems}`, 20);
    addText(`${t.totalWeight}: ${totalWeight.toFixed(2)} kg`, 20);
    addText(`${t.totalVolume}: ${totalVolume.toFixed(2)} m³`, 20);
    yPosition += 10;
    
    // Quote Details
    addText(t.pricingBreakdown, 20, 14, true);
    addText(`${t.baseServiceFee}: $${bookingData.quote.baseServiceFee.toFixed(2)}`, 20);
    addText(`${t.itemCost}: $${bookingData.quote.itemCost.toFixed(2)}`, 20);
    addText(`${t.distanceFee}: $${bookingData.quote.distanceFee.toFixed(2)}`, 20);
    addText(`${t.subtotal}: $${bookingData.quote.subtotal.toFixed(2)}`, 20);
    addText(`${t.gst}: $${bookingData.quote.gst.toFixed(2)}`, 20);
    addText(`${t.qst}: $${bookingData.quote.qst.toFixed(2)}`, 20);
    addText(`${t.total}: $${bookingData.quote.total.toFixed(2)}`, 20, 12, true);
    yPosition += 10;
    
    // Signature sections
    addText(t.signatures, 20, 14, true);
    addText(t.customerSignaturePickup, 20);
    yPosition += 10;
    addText(t.customerSignatureDelivery, 20);
    yPosition += 10;
    addText(t.driverSignature, 20);
    yPosition += 15;
    
    // Footer
    addText(t.thankYou, 20, 10);
    addText(t.contact, 20, 10);
    
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