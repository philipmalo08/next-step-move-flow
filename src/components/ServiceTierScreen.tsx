import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Star, Crown, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceTier {
  id: string;
  name: string;
  price: number;
  priceUnit: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
}

const serviceTiers: ServiceTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2.50,
    priceUnit: 'per lb',
    description: 'Essential moving service with professional movers',
    features: [
      'Professional movers',
      'Basic insurance coverage',
      'Loading & unloading',
      'Transportation included'
    ],
    icon: Shield
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 3.25,
    priceUnit: 'per lb',
    description: 'Enhanced service with additional protection',
    features: [
      'Everything in Basic',
      'Furniture padding',
      'Full insurance coverage',
      'Disassembly & reassembly',
      'Priority scheduling'
    ],
    icon: Star,
    popular: true
  },
  {
    id: 'white-glove',
    name: 'White Glove',
    price: 4.50,
    priceUnit: 'per lb',
    description: 'Premium service with complete care',
    features: [
      'Everything in Premium',
      'Packing & unpacking',
      'Premium insurance',
      'Specialty item handling',
      'Setup at new location',
      'Dedicated team lead'
    ],
    icon: Crown
  }
];

interface ServiceTierScreenProps {
  onNext: (tier: ServiceTier) => void;
  onBack: () => void;
}

export function ServiceTierScreen({ onNext, onBack }: ServiceTierScreenProps) {
  const [selectedTier, setSelectedTier] = useState<string>('premium');

  const handleNext = () => {
    const tier = serviceTiers.find(t => t.id === selectedTier);
    if (tier) {
      onNext(tier);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Choose your service level</h2>
        <p className="text-muted-foreground">Select the service tier that best fits your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {serviceTiers.map((tier) => {
          const IconComponent = tier.icon;
          const isSelected = selectedTier === tier.id;
          
          return (
            <Card
              key={tier.id}
              className={cn(
                "relative p-6 cursor-pointer transition-all duration-300 hover:shadow-medium",
                isSelected 
                  ? "border-primary shadow-glow bg-primary/5" 
                  : "border-border hover:border-primary/50",
                tier.popular && "border-accent"
              )}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-success text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3",
                  isSelected ? "bg-gradient-primary" : "bg-muted"
                )}>
                  <IconComponent className={cn(
                    "w-6 h-6",
                    isSelected ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-primary">${tier.price}</span>
                  <span className="text-muted-foreground ml-1">{tier.priceUnit}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <div className="space-y-3">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className={cn(
                "absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              )}>
                {isSelected && (
                  <Check className="w-3 h-3 text-primary-foreground absolute top-0.5 left-0.5" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Summary */}
      {selectedTier && (
        <Card className="p-4 bg-gradient-primary/5 border-primary/20 animate-fade-in-up">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Selected Service</p>
            <p className="font-medium text-lg">
              {serviceTiers.find(t => t.id === selectedTier)?.name} - 
              ${serviceTiers.find(t => t.id === selectedTier)?.price} per lb
            </p>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext}
          className="group"
        >
          Continue
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </div>
    </div>
  );
}