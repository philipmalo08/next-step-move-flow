import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Lock, ArrowRight, User, Mail, Phone, AlertTriangle } from "lucide-react";
import { saveBooking, BookingData } from "@/lib/bookingService";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { supabase } from "@/integrations/supabase/client";
import { paymentDataSchema } from "@/lib/validation";

interface PaymentScreenProps {
  quote: {
    baseServiceFee: number;
    itemCost: number;
    distanceFee: number;
    subtotal: number;
    gst: number;
    qst: number;
    total: number;
  };
  pickupAddress: string;
  distance: number;
  onNext: (paymentData: PaymentData, bookingId?: string) => void;
  onBack: () => void;
  // Full booking data for saving to Supabase
  bookingData: Omit<BookingData, 'paymentData'>;
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

export function PaymentScreen({ quote, pickupAddress, distance, onNext, onBack, bookingData }: PaymentScreenProps) {
  const [formData, setFormData] = useState<PaymentData>({
    fullName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    billingCity: '',
    billingPostal: ''
  });

  const [errors, setErrors] = useState<Partial<PaymentData>>({});
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { executeRecaptcha } = useRecaptcha();

  // Auto-fill billing address when "same as pickup" is checked
  const handleSameAsPickupChange = (checked: boolean) => {
    setSameAsPickup(checked);
    if (checked && pickupAddress) {
      // Extract city and postal from pickup address (basic parsing)
      const addressParts = pickupAddress.split(',');
      if (addressParts.length >= 3) {
        const streetAddress = addressParts[0].trim();
        const cityPart = addressParts[addressParts.length - 2].trim();
        const postalPart = addressParts[addressParts.length - 1].trim();
        
        setFormData(prev => ({
          ...prev,
          billingAddress: streetAddress,
          billingCity: cityPart,
          billingPostal: postalPart
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          billingAddress: pickupAddress,
          billingCity: '',
          billingPostal: ''
        }));
      }
    }
  };

  const updateField = (field: keyof PaymentData, value: string) => {
    // For cardholder name, preserve spaces while sanitizing basic input
    const sanitizedValue = field === 'cardholderName' 
      ? value.replace(/[<>]/g, '').trim()
      : value.replace(/[<>]/g, '').trim();
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const match = v.substring(0, 16);
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.join(' ').trim();
  };

  const formatPhoneNumber = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 3) return v;
    if (v.length <= 6) return `(${v.slice(0, 3)}) ${v.slice(3)}`;
    return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}`;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = (): boolean => {
    try {
      // Use Zod schema for comprehensive validation
      paymentDataSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Partial<PaymentData> = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof PaymentData;
          newErrors[field] = err.message;
        });
      }
      
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute reCAPTCHA for additional security
      const recaptchaToken = await executeRecaptcha('payment_submission');

      // Verify reCAPTCHA token
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token: recaptchaToken, action: 'payment_submission' }
      });

      if (verificationError || !verificationData?.success) {
        throw new Error('Security verification failed. Please try again.');
      }

      // Get secure device session ID from localStorage
      const deviceId = localStorage.getItem('secure_device_id');
      
      if (!deviceId) {
        throw new Error("Device session required");
      }

      // Get the device session from Supabase
      const { data: deviceSession, error: sessionError } = await supabase
        .from('device_sessions')
        .select('id')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (sessionError) {
        console.error('Device session error:', sessionError);
        throw new Error("Failed to retrieve device session");
      }

      const userId = deviceSession?.id;
      if (!userId) {
        throw new Error("Valid device session required. Please refresh the page and try again.");
      }

      // Prepare complete booking data
      const completeBookingData: BookingData = {
        ...bookingData,
        paymentData: formData
      };

      // Save booking to Supabase
      const bookingId = await saveBooking(completeBookingData, userId, distance);
      
      toast({
        title: "Booking Confirmed!",
        description: `Your booking has been saved with ID: ${bookingId}`,
      });

      // Proceed to confirmation screen
      onNext(formData, bookingId);
      
    } catch (error) {
      console.error("Error processing booking:", error);
      toast({
        title: "Booking Error",
        description: "There was an issue saving your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Details</h2>
        <p className="text-muted-foreground">Complete your booking with secure payment</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', formatPhoneNumber(e.target.value))}
                    placeholder="(123) 456-7890"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
              </div>
            </Card>

            {/* Payment Information */}
            <Card className="p-6 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Information
              </h3>
              
              {/* Credit Card Logos */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>We accept:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div className="w-8 h-5 bg-gradient-to-r from-red-600 to-orange-400 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">MC</span>
                  </div>
                  <div className="w-8 h-5 bg-gradient-to-r from-blue-500 to-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AMEX</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => updateField('cardNumber', formatCardNumber(e.target.value))}
                    maxLength={19}
                    className={errors.cardNumber ? 'border-destructive' : ''}
                  />
                  {errors.cardNumber && <p className="text-xs text-destructive mt-1">{errors.cardNumber}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => updateField('expiryDate', formatExpiryDate(e.target.value))}
                      maxLength={5}
                      className={errors.expiryDate ? 'border-destructive' : ''}
                    />
                    {errors.expiryDate && <p className="text-xs text-destructive mt-1">{errors.expiryDate}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => updateField('cvv', e.target.value.replace(/\D/g, '').substring(0, 4))}
                      className={errors.cvv ? 'border-destructive' : ''}
                    />
                    {errors.cvv && <p className="text-xs text-destructive mt-1">{errors.cvv}</p>}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="cardholderName">Cardholder Name *</Label>
                  <Input
                    id="cardholderName"
                    value={formData.cardholderName}
                    onChange={(e) => updateField('cardholderName', e.target.value)}
                    className={errors.cardholderName ? 'border-destructive' : ''}
                  />
                  {errors.cardholderName && <p className="text-xs text-destructive mt-1">{errors.cardholderName}</p>}
                </div>
              </div>
            </Card>

            {/* Billing Address */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Billing Address</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="same-as-pickup" 
                    checked={sameAsPickup}
                    onCheckedChange={(checked) => handleSameAsPickupChange(checked as boolean)}
                  />
                  <Label htmlFor="same-as-pickup" className="text-sm">Same as pickup address</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="billingAddress">Street Address *</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => updateField('billingAddress', e.target.value)}
                    disabled={sameAsPickup}
                    className={errors.billingAddress ? 'border-destructive' : ''}
                  />
                  {errors.billingAddress && <p className="text-xs text-destructive mt-1">{errors.billingAddress}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingCity">City *</Label>
                    <Input
                      id="billingCity"
                      value={formData.billingCity}
                      onChange={(e) => updateField('billingCity', e.target.value)}
                      disabled={sameAsPickup}
                      className={errors.billingCity ? 'border-destructive' : ''}
                    />
                    {errors.billingCity && <p className="text-xs text-destructive mt-1">{errors.billingCity}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="billingPostal">Postal Code *</Label>
                    <Input
                      id="billingPostal"
                      value={formData.billingPostal}
                      onChange={(e) => updateField('billingPostal', e.target.value.toUpperCase())}
                      disabled={sameAsPickup}
                      className={errors.billingPostal ? 'border-destructive' : ''}
                    />
                    {errors.billingPostal && <p className="text-xs text-destructive mt-1">{errors.billingPostal}</p>}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 shadow-soft sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${quote.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>GST (5%)</span>
                  <span>${quote.gst.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>QST (9.975%)</span>
                  <span>${quote.qst.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${quote.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Your payment is secured with SSL encryption</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          <Button variant="outline" type="button" onClick={onBack}>
            Back
          </Button>
          <Button 
            type="submit"
            size="lg"
            className="group"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Complete Booking"}
            {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />}
          </Button>
        </div>
      </form>
      
      {/* Copyright Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">© 2021 Next Movement. All rights reserved.</p>
      </div>
    </div>
  );
}