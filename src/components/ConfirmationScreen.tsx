import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, Clock, MapPin, Package, Phone, Mail, CreditCard, Download } from "lucide-react";
import { generateBookingPDF, downloadPDF } from "@/lib/pdfGenerator";
import { useState } from "react";

interface BookingData {
  date: Date;
  time: string;
  addresses: Array<{ id: string; address: string; type: 'pickup' | 'dropoff' }>;
  serviceTier: { id: string; name: string; price: number; priceUnit: string };
  items: Array<{ id: string; name: string; category: string; quantity: number; weight: number; volume: number }>;
  quote: { baseServiceFee: number; itemCost: number; distanceFee: number; subtotal: number; gst: number; qst: number; total: number };
  paymentData: { fullName: string; email: string; phone: string; billingAddress: string; billingCity: string; billingPostal: string };
}

interface ConfirmationScreenProps {
  bookingData: BookingData;
  onStartNew: () => void;
}

const timeSlotLabels: Record<string, string> = {
  '8-10': '8:00 AM - 10:00 AM',
  '10-12': '10:00 AM - 12:00 PM',
  '12-14': '12:00 PM - 2:00 PM',
  '14-16': '2:00 PM - 4:00 PM',
  '16-18': '4:00 PM - 6:00 PM',
  '18-20': '6:00 PM - 8:00 PM'
};

export function ConfirmationScreen({ bookingData, onStartNew }: ConfirmationScreenProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const totalWeight = bookingData.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalVolume = bookingData.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
  const totalItems = bookingData.items.reduce((sum, item) => sum + item.quantity, 0);
  
  const bookingId = `NM-${Date.now().toString().slice(-6)}`;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = await generateBookingPDF(bookingData, bookingId);
      const filename = `NextMovement-Booking-${bookingId}.pdf`;
      downloadPDF(pdfBlob, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-success rounded-full mb-6 animate-fade-in-up">
          <CheckCircle className="w-10 h-10 text-accent-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">Booking Confirmed!</h1>
        <p className="text-xl text-muted-foreground mb-2">
          Your move has been successfully scheduled. A booking confirmation and receipt will be sent to you by email.
        </p>
        <p className="text-lg font-medium text-primary">
          Booking ID: <span className="font-mono">{bookingId}</span>
        </p>
      </div>

      {/* Move Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Date & Time */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Date & Time
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{bookingData.date.toLocaleDateString('en-CA', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{timeSlotLabels[bookingData.time as keyof typeof timeSlotLabels]}</span>
            </div>
          </div>
        </Card>

        {/* Service Details */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Service Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Service Tier</p>
              <p className="font-medium">{bookingData.serviceTier.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-lg font-bold text-primary">${bookingData.quote.total.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Addresses */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Locations
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-accent mb-2">Pickup Location(s)</p>
            {bookingData.addresses.filter(addr => addr.type === 'pickup').map((addr, index) => (
              <p key={index} className="text-muted-foreground mb-1">{addr.address}</p>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-primary mb-2">Drop-off Location(s)</p>
            {bookingData.addresses.filter(addr => addr.type === 'dropoff').map((addr, index) => (
              <p key={index} className="text-muted-foreground mb-1">{addr.address}</p>
            ))}
          </div>
        </div>
      </Card>

      {/* Items Summary */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Items Summary
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{totalItems}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{totalWeight.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">lbs</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{totalVolume.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">ft³</p>
          </div>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {bookingData.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">Qty: {item.quantity}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{bookingData.paymentData.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{bookingData.paymentData.phone}</span>
          </div>
        </div>
      </Card>


      {/* Actions */}
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          Need to make changes? Contact us at <span className="font-medium">(438) 543-0904</span> or <span className="font-medium">mouvementsuivant@outlook.com</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleDownloadPDF}
            variant="default"
            size="lg"
            disabled={isGeneratingPDF}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Download Move Details & Checklist'}
          </Button>
          
          <Button 
            onClick={onStartNew}
            variant="outline"
            size="lg"
          >
            Book Another Move
          </Button>
        </div>
      </div>
      
      {/* Copyright Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">© 2021 Next Movement. All rights reserved.</p>
      </div>
    </div>
  );
}