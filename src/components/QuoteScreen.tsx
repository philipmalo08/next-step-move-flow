import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, MapPin, Package, ArrowRight, ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface QuoteScreenProps {
  items: Item[];
  serviceTier: ServiceTier;
  distance: number;
  onNext: (quote: QuoteData) => void;
  onBack: () => void;
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

export function QuoteScreen({ items, serviceTier, distance, onNext, onBack }: QuoteScreenProps) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Simulate quote calculation
    const timer = setTimeout(() => {
      const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
      
        // Tier pricing rates
        const tierRates = {
            "Basic": 0.35,
            "Premium": 0.38,
            "White Glove": 0.41
        };

      const baseServiceFee = 50;
      const itemCost = totalWeight * (tierRates[serviceTier.name as keyof typeof tierRates] || 0.31);
      const distanceFee = distance * 2.64;
      const subtotal = baseServiceFee + itemCost + distanceFee;
      const gst = subtotal * 0.05; // 5% GST
      const qst = subtotal * 0.09975; // 9.975% QST
      const total = subtotal + gst + qst;

      setQuote({
        baseServiceFee,
        itemCost,
        distanceFee,
        subtotal,
        gst,
        qst,
        total
      });
      setIsCalculating(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [items, serviceTier, distance]);

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleEmailQuote = async () => {
    if (!email.trim()) {
      toast.error(t('quote.enterEmail'));
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          to: email.trim(),
          quote,
          items,
          serviceTier,
          distance,
          language
        }
      });

      if (error) {
        throw error;
      }

      toast.success(t('quote.emailSent'));
      setEmailDialogOpen(false);
      setEmail("");
    } catch (error) {
      console.error('Error sending quote email:', error);
      toast.error(t('quote.emailError'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isCalculating) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('quote.calculating')}</h2>
          <p className="text-muted-foreground">{t('quote.calculatingDesc')}</p>
        </div>

        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full animate-pulse mb-4">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">{t('quote.analyzingItems')}</p>
          <p className="text-muted-foreground">{t('quote.analyzingDesc')}</p>
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="min-h-screen bg-gradient-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-success rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-accent-foreground" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t('quote.title')}</h2>
          <p className="text-muted-foreground">{t('quote.subtitle')}</p>
        </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quote Breakdown */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            {t('quote.breakdown')}
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>{t('quote.baseService')}</span>
              <span>${quote.baseServiceFee.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>{t('quote.itemCost')} ({totalWeight} lbs)</span>
              <span>${quote.itemCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>{t('quote.distanceFee')} ({distance.toFixed(1)} km)</span>
              <span>${quote.distanceFee.toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-medium">
              <span>{t('quote.subtotal')}</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('quote.gst')}</span>
              <span>${quote.gst.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('quote.qst')}</span>
              <span>${quote.qst.toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-xl font-bold text-primary">
              <span>{t('quote.total')}</span>
              <span>${quote.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="space-y-6">
          {/* Service Tier */}
          <Card className="p-4 shadow-soft">
            <h4 className="font-semibold mb-2">{t('quote.selectedService')}</h4>
            <p className="text-primary font-medium">{serviceTier.name}</p>
          </Card>

          {/* Items Summary */}
          <Card className="p-4 shadow-soft">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('quote.itemsSummary')}
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{totalItems}</p>
                <p className="text-sm text-muted-foreground">{t('quote.items')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{totalWeight.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">lbs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{totalVolume.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">ft³</p>
              </div>
            </div>
          </Card>

          {/* Distance */}
          <Card className="p-4 shadow-soft">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('quote.distance')}
            </h4>
            <p className="text-2xl font-bold text-primary">{distance.toFixed(1)} km</p>
          </Card>
        </div>
      </div>

      {/* What's Included */}
      <Card className="p-6 bg-gradient-primary/5 border-primary/20">
        <h3 className="text-lg font-semibold mb-4">{t('quote.whatsIncluded')}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">{t('quote.included1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">{t('quote.included2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">{t('quote.included3')}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">{t('quote.included4')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">{t('quote.included5')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">{t('quote.included6')}</span>
            </div>
          </div>
        </div>
      </Card>

        {/* Email Quote Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <Mail className="h-4 w-4 mr-2" />
              {t('quote.emailQuote')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('quote.emailQuote')}</DialogTitle>
              <DialogDescription>
                {t('quote.emailQuoteDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('quote.enterEmail')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('quote.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEmailQuote();
                    }
                  }}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setEmailDialogOpen(false)}
                  className="flex-1"
                >
                  {t('quote.cancel')}
                </Button>
                <Button 
                  onClick={handleEmailQuote} 
                  disabled={isSendingEmail}
                  className="flex-1"
                >
                  {isSendingEmail ? '...' : t('quote.send')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
          <Button 
            onClick={() => onNext(quote)}
            className="flex-1 group"
          >
            {t('quote.bookThisMove')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </div>
      
      {/* Copyright Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">{t('welcome.copyright')}</p>
      </div>
    </div>
  );
}