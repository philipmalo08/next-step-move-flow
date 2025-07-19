import { Button } from "@/components/ui/button";
import { Truck, ArrowRight, Star } from "lucide-react";
import logoImage from "@/assets/nextmovement-final.PNG?url";
import { useLanguage } from "@/contexts/LanguageContext";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Animated Logo */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-full shadow-glow animate-bounce-gentle">
              <Truck className="w-12 h-12 text-primary-foreground" />
            </div>
            <img 
              src={logoImage} 
              alt="Next Movement" 
              className="mt-4 h-12 md:h-16 w-auto mx-auto"
            />
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t('welcome.tagline')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-lg p-4 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('welcome.features.instantQuotes')}</h3>
              <p className="text-muted-foreground">{t('welcome.features.instantQuotesDesc')}</p>
            </div>
            
            <div className="bg-card rounded-lg p-4 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Truck className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('welcome.features.professionalService')}</h3>
              <p className="text-muted-foreground">{t('welcome.features.professionalServiceDesc')}</p>
            </div>
            
            <div className="bg-card rounded-lg p-4 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 mx-auto">
                <ArrowRight className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('welcome.features.easyBooking')}</h3>
              <p className="text-muted-foreground">{t('welcome.features.easyBookingDesc')}</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            size="lg" 
            onClick={onStart}
            className="group animate-fade-in-up"
          >
            {t('welcome.startMove')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
          
          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center space-x-6 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 fill-current text-yellow-500" />
              <span className="text-sm">{t('welcome.trust.rating')}</span>
            </div>
            <div className="text-sm">{t('welcome.trust.customers')}</div>
            <div className="text-sm">{t('welcome.trust.insured')}</div>
          </div>
        </div>
      </div>
      
      {/* Copyright Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">{t('confirmation.copyright')}</p>
      </div>
    </div>
  );
}