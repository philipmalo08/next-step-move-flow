import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";

interface ServiceTier {
  id: string;
  name: string;
  price: number;
  priceUnit: string;
  description: string;
  features: string[];
  icon: string;
  popular?: boolean;
}

const serviceTiers: ServiceTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: 0.31,
    priceUnit: "per lb",
    description: "Standard move. Furniture protected with moving blankets. Packing boxes not included.",
    features: [
      "Professional moving team",
      "Furniture protection with blankets", 
      "Standard liability coverage",
      "Loading & unloading"
    ],
    icon: "📦"
  },
  {
    id: "premium", 
    name: "Premium",
    price: 0.34,
    priceUnit: "per lb",
    description: "Includes packing services for all your small items into boxes, plus standard furniture protection.",
    features: [
      "Everything in Basic",
      "Packing services included",
      "Moving boxes provided",
      "Enhanced liability coverage",
      "Furniture disassembly/assembly"
    ],
    icon: "⭐",
    popular: true
  },
  {
    id: "white-glove",
    name: "White Glove",
    price: 0.37,
    priceUnit: "per lb",
    description: "Full-service move including disassembly and reassembly of furniture, and packing services.",
    features: [
      "Everything in Premium",
      "Full packing & unpacking",
      "Furniture disassembly/reassembly",
      "Custom crating for valuables",
      "Setup & arrangement service",
      "White glove handling"
    ],
    icon: "👑"
  }
];

const getTierColor = (tierId: string) => {
  switch (tierId) {
    case "basic": return "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950";
    case "premium": return "text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950";
    case "white-glove": return "text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950";
    default: return "";
  }
};

interface ServiceTierScreenProps {
  onNext: (tier: ServiceTier) => void;
  onBack: () => void;
}

export const ServiceTierScreen = ({ onNext, onBack }: ServiceTierScreenProps) => {
  const [selectedTier, setSelectedTier] = useState<string>('');

  const handleNext = () => {
    const tier = serviceTiers.find(t => t.id === selectedTier);
    if (tier) {
      onNext(tier);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl sm:text-2xl">Choose Your Service Level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {serviceTiers.map((tier) => (
                <Card
                  key={tier.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTier === tier.id 
                      ? 'ring-2 ring-primary border-primary shadow-lg' 
                      : 'hover:border-primary/50'
                  } ${tier.popular ? 'relative overflow-hidden' : ''} ${getTierColor(tier.id)}`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                      Popular
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center mb-4">
                      <div className="text-2xl sm:text-3xl mb-2">{tier.icon}</div>
                      <h3 className="text-lg sm:text-xl font-bold">{tier.name}</h3>
                    </div>
                    <p className="text-muted-foreground text-center mb-4 text-sm">{tier.description}</p>
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-xs sm:text-sm">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Tier Summary */}
            {selectedTier && (
              <Card className="bg-accent/50 border-0">
                <CardContent className="pt-4 pb-4">
                  <div className="text-center">
                    <h3 className="font-semibold mb-3">Selected Service</h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">{serviceTiers.find(t => t.id === selectedTier)?.icon}</span>
                      <span className="text-lg font-bold">{serviceTiers.find(t => t.id === selectedTier)?.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-6">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!selectedTier}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};