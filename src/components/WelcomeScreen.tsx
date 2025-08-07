import { Button } from "@/components/ui/button";
import { Truck, ArrowRight, Star, FileText } from "lucide-react";
const logoImageEn = "/assets/nextmovement-final.PNG";
const logoImageFr = "/assets/mouvementsuivant-final1.PNG";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getUserIdentifier } from "@/lib/sessionManager";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { t, language } = useLanguage();
  const logoImage = language === 'fr' ? logoImageFr : logoImageEn;
  const [email, setEmail] = useState('');
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isSendingChecklist, setIsSendingChecklist] = useState(false);

  const handleChecklistRequest = async () => {
    if (!email) {
      toast.error(language === 'fr' ? 'Veuillez entrer votre adresse e-mail' : 'Please enter your email address');
      return;
    }

    setIsSendingChecklist(true);
    try {
      const userIdentifier = await getUserIdentifier();
      
      // Save email to chatbot_emails table (same as chatbot)
      await supabase.from('chatbot_emails').insert({
        email,
        user_session_id: userIdentifier,
        questions_asked: 0, // Different from chatbot to distinguish
        marketing_email_sent: false
      });

      // Send checklist email
      const { error } = await supabase.functions.invoke('send-checklist-email', {
        body: {
          email,
          language: language || 'en'
        }
      });

      if (error) throw error;

      toast.success(language === 'fr' ? 'Liste de vérification envoyée par e-mail!' : 'Checklist sent to your email!');
      setIsChecklistModalOpen(false);
      setEmail('');
    } catch (error) {
      console.error('Error sending checklist:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'envoi de la liste' : 'Error sending checklist');
    } finally {
      setIsSendingChecklist(false);
    }
  };
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={onStart}
              className="group animate-fade-in-up"
            >
              {t('welcome.startMove')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>

            <Dialog open={isChecklistModalOpen} onOpenChange={setIsChecklistModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="group animate-fade-in-up"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {language === 'fr' ? 'Liste de vérification' : 'Moving Checklist'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {language === 'fr' ? 'Recevez votre liste de vérification' : 'Get Your Moving Checklist'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' 
                      ? 'Entrez votre adresse e-mail pour recevoir notre liste complète de vérification de déménagement.'
                      : 'Enter your email to receive our comprehensive moving checklist.'}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="checklist-email">
                      {language === 'fr' ? 'Adresse e-mail' : 'Email Address'}
                    </Label>
                    <Input
                      id="checklist-email"
                      type="email"
                      placeholder={language === 'fr' ? 'votre@email.com' : 'your@email.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleChecklistRequest} 
                    disabled={isSendingChecklist}
                    className="w-full"
                  >
                    {isSendingChecklist 
                      ? (language === 'fr' ? 'Envoi...' : 'Sending...') 
                      : (language === 'fr' ? 'Envoyer la liste' : 'Send Checklist')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
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