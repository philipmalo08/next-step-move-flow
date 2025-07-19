import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Mail, HelpCircle, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const HelpSupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="sm"
          className="shadow-glow"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          {t('helpSupport')}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t('customerSupport')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <Link to="/faq" onClick={() => setIsOpen(false)} className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileQuestion className="w-4 h-4 mr-2" />
                {t('viewFAQ')}
              </Button>
            </Link>
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 p-4 bg-muted rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('phone')}</p>
                  <a 
                    href="tel:+14385430904" 
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    (438) 543-0904
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3 p-4 bg-muted rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('email')}</p>
                  <a 
                    href="mailto:mouvementsuivant@outlook.com" 
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    mouvementsuivant@outlook.com
                  </a>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('customerServiceDescription')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};