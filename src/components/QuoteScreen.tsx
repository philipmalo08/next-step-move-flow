import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, MapPin, Package, ArrowRight, CheckCircle } from "lucide-react";

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

  useEffect(() => {
    // Simulate quote calculation
    const timer = setTimeout(() => {
      const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const totalVolume = items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
      
      const baseServiceFee = 150;
      const itemCost = totalWeight * serviceTier.price;
      const distanceFee = distance * 2.5; // $2.50 per km
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

  if (isCalculating) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Calculating Your Quote</h2>
          <p className="text-muted-foreground">Please wait while we prepare your instant quote</p>
        </div>

        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full animate-pulse mb-4">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">Analyzing your items...</p>
          <p className="text-muted-foreground">This will only take a moment</p>
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-success rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-accent-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Your Instant Quote</h2>
        <p className="text-muted-foreground">Here's your personalized moving quote</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Quote Breakdown */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Quote Breakdown
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Base Service Fee</span>
              <span>${quote.baseServiceFee.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Items Cost ({totalWeight} lbs × ${serviceTier.price})</span>
              <span>${quote.itemCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Distance Fee ({distance.toFixed(1)} km × $2.50)</span>
              <span>${quote.distanceFee.toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-medium">
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
            
            <div className="flex justify-between text-xl font-bold text-primary">
              <span>Total</span>
              <span>${quote.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="space-y-6">
          {/* Service Tier */}
          <Card className="p-4 shadow-soft">
            <h4 className="font-semibold mb-2">Selected Service</h4>
            <p className="text-primary font-medium">{serviceTier.name} - ${serviceTier.price} per lb</p>
          </Card>

          {/* Items Summary */}
          <Card className="p-4 shadow-soft">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Items Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Items</p>
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
              Distance
            </h4>
            <p className="text-2xl font-bold text-primary">{distance.toFixed(1)} km</p>
          </Card>
        </div>
      </div>

      {/* What's Included */}
      <Card className="p-6 bg-gradient-primary/5 border-primary/20">
        <h3 className="text-lg font-semibold mb-4">What's Included in Your Quote</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">Professional moving team</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">All necessary equipment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">Loading and unloading</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">Transportation between locations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">Basic insurance coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm">No hidden fees</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={() => onNext(quote)}
          size="lg"
          className="group"
        >
          Book This Move
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </div>
    </div>
  );
}