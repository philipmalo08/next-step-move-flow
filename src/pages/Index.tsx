import { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AddressScreen } from "@/components/AddressScreen";
import { DateTimeScreen } from "@/components/DateTimeScreen";
import { ServiceTierScreen } from "@/components/ServiceTierScreen";
import { ItemsScreen } from "@/components/ItemsScreen";
import { QuoteScreen } from "@/components/QuoteScreen";
import { PaymentScreen } from "@/components/PaymentScreen";
import { ConfirmationScreen } from "@/components/ConfirmationScreen";
import { StepIndicator } from "@/components/StepIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useRecaptcha } from "@/hooks/useRecaptcha";

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
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: string;
  billingCity: string;
  billingPostal: string;
}

const STEPS = [
  'Welcome',
  'Addresses',
  'Date & Time',
  'Service Tier',
  'Items',
  'Quote',
  'Payment',
  'Confirmation'
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [serviceTier, setServiceTier] = useState<ServiceTier>();
  const [items, setItems] = useState<Item[]>([]);
  const [quote, setQuote] = useState<QuoteData>();
  const [paymentData, setPaymentData] = useState<PaymentData>();
  const [distance, setDistance] = useState<number>(0);
  const [deviceUserId, setDeviceUserId] = useState<string | null>(null);
  
  // Initialize reCAPTCHA for bot protection
  useRecaptcha();

  // Initialize device-based session with Supabase
  useEffect(() => {
    const initializeDeviceSession = async () => {
      try {
        // Generate or retrieve device ID from localStorage
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('device_id', deviceId);
        }

        // Create or update device session in Supabase
        const { data, error } = await supabase
          .from('device_sessions')
          .upsert({
            device_id: deviceId,
            session_data: { 
              created_at: new Date().toISOString(),
              user_agent: navigator.userAgent 
            }
          }, { 
            onConflict: 'device_id' 
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating device session:", error);
        } else {
          setDeviceUserId(data.id);
          console.log("Device session ID:", data.id);
        }
      } catch (error) {
        console.error("Error initializing device session:", error);
      }
    };

    initializeDeviceSession();
  }, []);

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleAddressNext = (addressData: Address[], estimatedDistance: number) => {
    setAddresses(addressData);
    setDistance(estimatedDistance);
    setCurrentStep(2);
  };

  const handleDateTimeNext = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep(3);
  };

  const handleServiceTierNext = (tier: ServiceTier) => {
    setServiceTier(tier);
    setCurrentStep(4);
  };

  const handleItemsNext = (itemData: Item[]) => {
    setItems(itemData);
    setCurrentStep(5);
  };

  const handleQuoteNext = (quoteData: QuoteData) => {
    setQuote(quoteData);
    setCurrentStep(6);
  };

  const handlePaymentNext = (paymentInfo: PaymentData, bookingId?: string) => {
    setPaymentData(paymentInfo);
    // Store booking ID if provided
    if (bookingId) {
      console.log("Booking saved with ID:", bookingId);
    }
    setCurrentStep(7);
  };

  const handleStartNew = () => {
    setCurrentStep(0);
    setAddresses([]);
    setSelectedDate(undefined);
    setSelectedTime('');
    setServiceTier(undefined);
    setItems([]);
    setQuote(undefined);
    setPaymentData(undefined);
  };

  const goBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };


  if (currentStep === 0) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Progress Indicator */}
      {currentStep > 0 && currentStep < 7 && (
        <StepIndicator 
          currentStep={currentStep - 1} 
          totalSteps={6} 
          stepTitles={STEPS.slice(1, 7)} 
        />
      )}

      {/* Step Content */}
      <div className="pb-8">
        {currentStep === 1 && (
          <AddressScreen 
            onNext={handleAddressNext} 
            onBack={goBack}
          />
        )}
        
        {currentStep === 2 && (
          <DateTimeScreen 
            onNext={handleDateTimeNext} 
            onBack={goBack}
          />
        )}
        
        {currentStep === 3 && (
          <ServiceTierScreen 
            onNext={handleServiceTierNext} 
            onBack={goBack}
          />
        )}
        
        {currentStep === 4 && (
          <ItemsScreen 
            onNext={handleItemsNext} 
            onBack={goBack}
          />
        )}
        
        {currentStep === 5 && serviceTier && (
          <QuoteScreen 
            items={items}
            serviceTier={serviceTier}
            distance={distance}
            onNext={handleQuoteNext} 
            onBack={goBack}
          />
        )}
        
        {currentStep === 6 && quote && selectedDate && serviceTier && (
          <PaymentScreen 
            quote={quote}
            pickupAddress={addresses.find(addr => addr.type === 'pickup')?.address || ''}
            distance={distance}
            onNext={handlePaymentNext} 
            onBack={goBack}
            bookingData={{
              date: selectedDate,
              time: selectedTime,
              addresses,
              serviceTier,
              items,
              quote
            }}
          />
        )}
        
        {currentStep === 7 && selectedDate && serviceTier && quote && paymentData && (
          <ConfirmationScreen 
            bookingData={{
              date: selectedDate,
              time: selectedTime,
              addresses,
              serviceTier,
              items,
              quote,
              paymentData
            }}
            onStartNew={handleStartNew}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
