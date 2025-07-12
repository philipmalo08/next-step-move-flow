import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepTitles }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        {stepTitles.map((title, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Step Circle */}
            <div
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                index < currentStep
                  ? "bg-gradient-primary border-primary text-primary-foreground"
                  : index === currentStep
                  ? "bg-primary border-primary text-primary-foreground animate-pulse"
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
                "mt-2 text-xs font-medium text-center transition-colors duration-300",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {title}
            </span>
            
            {/* Connecting Line */}
            {index < totalSteps - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 hidden md:block">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    index < currentStep ? "bg-gradient-primary" : "bg-muted"
                  )}
                  style={{ width: "calc(100% - 5rem)" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Mobile Progress Bar */}
      <div className="mt-4 md:hidden">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}