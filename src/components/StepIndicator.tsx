import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepTitles }: StepIndicatorProps) {
  const { t } = useLanguage();
  
  // Map step titles to translation keys
  const getTranslatedTitle = (title: string) => {
    const keyMap: { [key: string]: string } = {
      'Addresses': 'steps.address',
      'Date & Time': 'steps.datetime',
      'Service Tier': 'steps.service', 
      'Items': 'steps.items',
      'Quote': 'steps.quote',
      'Payment': 'steps.payment',
      'Confirmation': 'steps.confirmation'
    };
    return t(keyMap[title] || title);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Desktop/Tablet Step Indicator */}
      <div className="hidden sm:flex items-center justify-between">
        {stepTitles.map((title, index) => (
          <div key={index} className="flex flex-col items-center relative flex-1">
            {/* Step Circle */}
            <div
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10",
                index < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-muted text-muted-foreground"
              )}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            {/* Step Title */}
            <span
              className={cn(
                "mt-2 text-xs font-medium text-center transition-colors duration-300 max-w-20",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {getTranslatedTitle(title)}
            </span>
            
            {/* Connecting Line */}
            {index < totalSteps - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                <div
                  className={cn(
                    "h-full transition-all duration-500 ml-5",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                  style={{ width: "calc(100% - 2.5rem)" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Mobile Step Indicator */}
      <div className="sm:hidden">
        {/* Current Step Display */}
        <div className="flex items-center justify-center mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-full border-2 flex items-center justify-center",
              "bg-primary border-primary text-primary-foreground"
            )}
          >
            {currentStep >= stepTitles.length ? (
              <Check className="w-6 h-6" />
            ) : (
              <span className="text-lg font-medium">{currentStep + 1}</span>
            )}
          </div>
        </div>
        
        {/* Current Step Title */}
        <div className="text-center mb-4">
          <h3 className="text-base font-semibold text-foreground">
            {currentStep < stepTitles.length ? getTranslatedTitle(stepTitles[currentStep]) : t('steps.confirmation')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {`${currentStep + 1} ${t('steps.stepOf')} ${totalSteps}`}
          </p>
        </div>
        
        {/* Mobile Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}