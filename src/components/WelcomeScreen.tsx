import { Button } from "@/components/ui/button";
import { Truck, ArrowRight, Star } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center px-4 py-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Animated Logo */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-full shadow-glow animate-bounce-gentle">
            <Truck className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">
            Next <span className="bg-gradient-primary bg-clip-text text-transparent">Movement</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Your move, simplified. Get an instant quote and book your move in minutes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-lg p-4 shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Star className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Quotes</h3>
            <p className="text-muted-foreground">Get accurate pricing based on your specific items and distance</p>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Truck className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Professional Service</h3>
            <p className="text-muted-foreground">Trained movers with full insurance coverage</p>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 mx-auto">
              <ArrowRight className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
            <p className="text-muted-foreground">Simple step-by-step process to schedule your move</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          size="lg" 
          onClick={onStart}
          className="group animate-fade-in-up"
        >
          Start Your Move
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
        
        {/* Trust Indicators */}
        <div className="mt-8 flex items-center justify-center space-x-6 text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 fill-current text-yellow-500" />
            <span className="text-sm">4.9/5 Rating</span>
          </div>
          <div className="text-sm">1000+ Happy Customers</div>
          <div className="text-sm">Fully Insured</div>
        </div>
      </div>
    </div>
  );
}