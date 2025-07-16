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
      // Try to parse address using Google address components if available
      // This assumes the address data includes components from Google Places API
      const addressData = bookingData.addresses?.find(addr => addr.type === 'pickup');
      
      if (addressData?.components) {
        // Extract components from Google Places API response
        const streetNumber = addressData.components.find((comp: any) => comp.types.includes('street_number'))?.long_name || '';
        const streetName = addressData.components.find((comp: any) => comp.types.includes('route'))?.long_name || '';
        const city = addressData.components.find((comp: any) => comp.types.includes('locality'))?.long_name || '';
        const postalCode = addressData.components.find((comp: any) => comp.types.includes('postal_code'))?.long_name || '';
        
        const streetAddress = `${streetNumber} ${streetName}`.trim();
        
        setFormData(prev => ({
          ...prev,
          billingAddress: streetAddress || pickupAddress.split(',')[0]?.trim() || '',
          billingCity: city,
          billingPostal: postalCode
        }));
      } else {
        // Fallback to basic parsing if no Google components available
        const addressParts = pickupAddress.split(',');
        if (addressParts.length >= 3) {
          const streetAddress = addressParts[0].trim();
          // The city is typically the second-to-last part before province/country
          const cityPart = addressParts[addressParts.length - 3]?.trim() || '';
          // Extract postal code from the last part (should contain postal code and country)
          const lastPart = addressParts[addressParts.length - 1].trim();
          // Canadian postal codes are in format like "H1A 1A1" - extract just the postal code
          const postalMatch = lastPart.match(/([A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)/);
          const postalPart = postalMatch ? postalMatch[1] : '';
          
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
    }
  };

  const updateField = (field: keyof PaymentData, value: string) => {
    // No sanitization - just update the field
    setFormData(prev => ({ ...prev, [field]: value }));
    
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
    const newErrors: Partial<PaymentData> = {};
    
    // Validate personal information (required for Stripe)
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    
    // Validate billing address
    if (!formData.billingAddress.trim()) {
      newErrors.billingAddress = "Billing address is required";
    }
    
    if (!formData.billingCity.trim()) {
      newErrors.billingCity = "City is required";
    }
    
    if (!formData.billingPostal.trim()) {
      newErrors.billingPostal = "Postal code is required";
    }
    
    // Card fields are no longer validated since Stripe handles payment
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStripePayment = async () => {
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

      // Generate a session-based user ID for the booking
      const sessionId = sessionStorage.getItem('booking_session_id') || crypto.randomUUID();
      sessionStorage.setItem('booking_session_id', sessionId);
      const userId = sessionId;

      // Prepare complete booking data and save to Supabase first
      const completeBookingData: BookingData = {
        ...bookingData,
        paymentData: formData
      };

      const bookingId = await saveBooking(completeBookingData, userId, distance);
      
      // Store booking ID for later reference
      sessionStorage.setItem('pending_booking_id', bookingId);

      // Create Stripe payment session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: Math.round(quote.total * 100), // Convert to cents
          currency: 'cad',
          description: `Moving Service - Booking ${bookingId}`,
          customerEmail: formData.email,
          customerName: formData.fullName,
          metadata: {
            bookingId,
            userId,
            distance: distance.toString(),
            serviceTier: bookingData.serviceTier.name
          }
        }
      });

      if (paymentError || !paymentData?.url) {
        throw new Error('Failed to create payment session');
      }

      // Store form data temporarily
      sessionStorage.setItem('payment_form_data', JSON.stringify(formData));

      // Redirect to Stripe Checkout
      window.open(paymentData.url, '_blank');
      
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Error",
        description: "There was an issue creating the payment session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleStripePayment();
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
                Secure Payment
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">Powered by Stripe</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your payment will be processed securely through Stripe. After clicking "Complete Booking", you'll be redirected to enter your payment information.
                  </p>
                  
                  {/* Payment Methods */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Accepted payments:</span>
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
                      <div className="w-8 h-5 bg-gradient-to-r from-gray-700 to-black rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">📱</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span>• Apple Pay</span>
                    <span>• Google Pay</span>
                    <span>• Credit/Debit Cards</span>
                  </div>
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
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Payment...
              </div>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with Stripe
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
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