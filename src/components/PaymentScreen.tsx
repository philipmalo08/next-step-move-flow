import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Lock, ArrowRight, User, Mail, Phone } from "lucide-react";

interface PaymentScreenProps {
  quote: {
    total: number;
    subtotal: number;
    gst: number;
    qst: number;
  };
  onNext: (paymentData: PaymentData) => void;
  onBack: () => void;
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

export function PaymentScreen({ quote, onNext, onBack }: PaymentScreenProps) {
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

  const updateField = (field: keyof PaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    const newErrors: Partial<PaymentData> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.cardNumber.replace(/\s/g, '').trim()) newErrors.cardNumber = 'Card number is required';
    if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required';
    if (!formData.cardholderName.trim()) newErrors.cardholderName = 'Cardholder name is required';
    if (!formData.billingAddress.trim()) newErrors.billingAddress = 'Billing address is required';
    if (!formData.billingCity.trim()) newErrors.billingCity = 'City is required';
    if (!formData.billingPostal.trim()) newErrors.billingPostal = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Payment Details</h2>
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
                    onChange={(e) => updateField('phone', e.target.value)}
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
              <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="billingAddress">Street Address *</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => updateField('billingAddress', e.target.value)}
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
          >
            Complete Booking
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </form>
    </div>
  );
}