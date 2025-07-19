import { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Phone, Lock } from "lucide-react";
import { saveBooking, BookingData } from "@/lib/bookingService";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const stripePromise = loadStripe('pk_test_51RkHNORATEydiMXF2HU30fVHXrYPMq4zvE9iXgIDJu2eqj5IbDK7eOhL1KM5dfGV9JqMBK9CH6HIWERUfi21JqUh008FtyrUB5'); // In production, this should be an environment variable

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
  bookingData: Omit<BookingData, 'paymentData'>;
}

interface PaymentData {
  fullName: string;
  email: string;
  phone: string;
  billingAddress: string;
  billingCity: string;
  billingPostal: string;
}

const CheckoutForm = ({ quote, formData, bookingData, distance }: { 
  quote: any; 
  formData: PaymentData; 
  bookingData: Omit<BookingData, 'paymentData'>;
  distance: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const { toast } = useToast();
  const { executeRecaptcha } = useRecaptcha();
  const { language, t } = useLanguage();

  // Set up Payment Request for Google Pay and Apple Pay
  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'CA',
        currency: 'cad',
        total: {
          label: 'Moving Service',
          amount: Math.round(quote.total * 100), // Convert to cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestPayerPhone: true,
      });

      // Check if Payment Request is available
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });

      pr.on('paymentmethod', async (e) => {
        try {
          setIsLoading(true);
          
          // Execute reCAPTCHA for additional security
          const recaptchaToken = await executeRecaptcha('payment_submission');

          // Verify reCAPTCHA token
          const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-recaptcha', {
            body: { token: recaptchaToken, action: 'payment_submission' }
          });

          if (verificationError || !verificationData.success) {
            throw new Error('Security verification failed. Please try again.');
          }

          const paymentData = {
            fullName: e.paymentMethod.billing_details.name || '',
            email: e.paymentMethod.billing_details.email || '',
            phone: e.paymentMethod.billing_details.phone || '',
            billingAddress: e.paymentMethod.billing_details.address?.line1 || '',
            billingCity: e.paymentMethod.billing_details.address?.city || '',
            billingPostal: e.paymentMethod.billing_details.address?.postal_code || '',
          };

          // Save booking - returns a booking ID string
          const bookingId = await saveBooking({
            ...bookingData,
            paymentData,
          });

          if (bookingId) {
            // Complete the payment request
            e.complete('success');
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed.",
            });
            window.location.href = `/payment-success?booking_id=${bookingId}`;
          } else {
            e.complete('fail');
            throw new Error('Failed to create booking');
          }
        } catch (error) {
          console.error('Error processing payment:', error);
          e.complete('fail');
          toast({
            title: "Payment Error",
            description: error instanceof Error ? error.message : "There was an issue processing the payment. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      });
    }
  }, [stripe, quote.total, executeRecaptcha, bookingData]);

  const validateFormData = (): boolean => {
    const requiredFields = ['fullName', 'email', 'phone', 'billingAddress', 'billingCity', 'billingPostal'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof PaymentData]?.trim());
    
    if (emptyFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before proceeding with payment.",
        variant: "destructive",
      });
      return false;
    }
    
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!validateFormData()) {
      return;
    }

    setIsLoading(true);

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

      const bookingId = await saveBooking(completeBookingData, userId, distance, language);
      
      // Store booking ID for later reference
      sessionStorage.setItem('pending_booking_id', bookingId);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Pay and Apple Pay buttons */}
      {canMakePayment && paymentRequest && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or pay with</span>
            </div>
          </div>
          <PaymentRequestButtonElement 
            options={{ paymentRequest, style: { paymentRequestButton: { height: '48px' } } }} 
          />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or pay with card</span>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />
        
        {/* Terms and Conditions */}
        <div className="text-center text-sm text-muted-foreground">
          {t('payment.termsText')}{" "}
          <Link 
            to="/terms-conditions" 
            className="text-primary hover:underline font-medium"
          >
            {t('payment.termsLink')}
          </Link>
        </div>
        
        <Button 
          type="submit" 
          disabled={!stripe || isLoading} 
          className="w-full"
          size="lg"
        >
          {isLoading ? t('payment.processing') : `${t('payment.completeBooking')} - $${quote?.total?.toFixed(2) || 0}`}
        </Button>
      </form>
    </div>
  );
};

export function PaymentScreen({ quote, pickupAddress, distance, onNext, onBack, bookingData }: PaymentScreenProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<PaymentData>({
    fullName: '',
    email: '',
    phone: '',
    billingAddress: '',
    billingCity: '',
    billingPostal: ''
  });

  const [errors, setErrors] = useState<Partial<PaymentData>>({});
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isFormValid, setIsFormValid] = useState(false);
  const { toast } = useToast();

  // Auto-fill billing address when "same as pickup" is checked
  const handleSameAsPickupChange = (checked: boolean) => {
    setSameAsPickup(checked);
    if (checked && pickupAddress) {
      const addressData = bookingData.addresses?.find(addr => addr.type === 'pickup');
      
      if (addressData?.components) {
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
        // Parse Canadian postal code from the full address string
        const addressParts = pickupAddress.split(',');
        const streetAddress = addressParts[0]?.trim() || '';
        
        // Find city and postal code from address parts
        let city = '';
        let postalCode = '';
        
        // Look for Canadian postal code pattern in any part
        for (let i = 0; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          const canadianPostalMatch = part.match(/([A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d)/);
          if (canadianPostalMatch) {
            postalCode = canadianPostalMatch[1].toUpperCase();
            // City is usually in the part before the postal code
            if (i > 0) {
              city = addressParts[i - 1]?.trim() || '';
            }
            break;
          }
        }
        
        // If no postal code found yet, try the last part
        if (!postalCode && addressParts.length > 1) {
          const lastPart = addressParts[addressParts.length - 1].trim();
          const postalMatch = lastPart.match(/([A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d)/);
          if (postalMatch) {
            postalCode = postalMatch[1].toUpperCase();
          }
        }
        
        // If no city found yet, use the second-to-last meaningful part
        if (!city && addressParts.length >= 2) {
          city = addressParts[addressParts.length - 2]?.trim() || '';
        }
        
        setFormData(prev => ({
          ...prev,
          billingAddress: streetAddress,
          billingCity: city,
          billingPostal: postalCode
        }));
      }
    }
  };

  const updateField = (field: keyof PaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPhoneNumber = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 3) return v;
    if (v.length <= 6) return `(${v.slice(0, 3)}) ${v.slice(3)}`;
    return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentData> = {};
    
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
    
    if (!formData.billingAddress.trim()) {
      newErrors.billingAddress = "Billing address is required";
    }
    
    if (!formData.billingCity.trim()) {
      newErrors.billingCity = "City is required";
    }
    
    if (!formData.billingPostal.trim()) {
      newErrors.billingPostal = "Postal code is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create PaymentIntent when quote is available
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!quote?.total) return;

      try {
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: Math.round(quote.total * 100), // Convert to cents
            currency: 'cad',
            description: `Moving Service - ${bookingData.serviceTier.name}`,
            customerEmail: formData.email || "guest@example.com",
            customerName: formData.fullName || "Guest Customer",
            metadata: {
              distance: distance.toString(),
              serviceTier: bookingData.serviceTier.name
            }
          }
        });

        if (error) throw error;

        if (data?.client_secret) {
          setClientSecret(data.client_secret);
        }
      } catch (error) {
        console.error('Payment intent creation error:', error);
        toast({
          title: "Payment Setup Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    };

    const timeoutId = setTimeout(createPaymentIntent, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData, quote?.total, distance, bookingData.serviceTier.name]);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('payment.title')}</h2>
        <p className="text-muted-foreground">{t('payment.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t('payment.personalInfo')}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">{t('payment.fullName')} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">{t('payment.email')} *</Label>
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
                <Label htmlFor="phone">{t('payment.phone')} *</Label>
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

          {/* Billing Address */}
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('payment.billingInfo')}</h3>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="same-as-pickup" 
                  checked={sameAsPickup}
                  onCheckedChange={(checked) => handleSameAsPickupChange(checked as boolean)}
                />
                <Label htmlFor="same-as-pickup" className="text-sm">{t('payment.sameAsPickup')}</Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="billingAddress">{t('payment.address')} *</Label>
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
                  <Label htmlFor="billingCity">{t('payment.city')} *</Label>
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
                  <Label htmlFor="billingPostal">{t('payment.postalCode')} *</Label>
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

          {/* Stripe Elements Payment Form */}
          {clientSecret && (
            <Card className="p-6 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Payment Information
              </h3>
              
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm 
                  quote={quote} 
                  formData={formData} 
                  bookingData={bookingData}
                  distance={distance}
                />
              </Elements>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6 shadow-soft sticky top-6">
            <h3 className="text-lg font-semibold mb-4">{t('payment.orderSummary')}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${quote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST</span>
                <span>${quote.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>QST</span>
                <span>${quote.qst.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${quote.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="w-full"
              >
                {t('back')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}