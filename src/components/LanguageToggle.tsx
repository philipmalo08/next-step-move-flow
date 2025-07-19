import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">
        {language === 'en' ? 'Français' : 'English'}
      </span>
    </Button>
  );
}