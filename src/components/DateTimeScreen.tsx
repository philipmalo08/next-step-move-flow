import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface DateTimeScreenProps {
  onNext: (date: Date, time: string) => void;
  onBack: () => void;
}

// Moved timeSlots inside component to access t function

export function DateTimeScreen({ onNext, onBack }: DateTimeScreenProps) {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');

  const timeSlots = [
    { id: 'morning', label: t('datetime.morning'), time: t('datetime.morningTime'), icon: '🌅' },
    { id: 'afternoon', label: t('datetime.afternoon'), time: t('datetime.afternoonTime'), icon: '☀️' },
    { id: 'evening', label: t('datetime.evening'), time: t('datetime.eveningTime'), icon: '🌆' }
  ];

  const canProceed = selectedDate && selectedTime;

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      onNext(selectedDate, selectedTime);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">{t('datetime.title')}</h2>
        <p className="text-muted-foreground">{t('datetime.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Date Selection */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('datetime.selectDate')}</h3>
          </div>
          
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="rounded-lg border p-3"
            />
          </div>
        </Card>

        {/* Time Selection */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('datetime.selectTime')}</h3>
          </div>
          
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedTime(slot.id)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-soft",
                  selectedTime === slot.id
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{slot.icon}</span>
                      <span className="font-medium">{slot.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{slot.time}</p>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 transition-colors",
                    selectedTime === slot.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <Card className="p-4 bg-gradient-primary/5 border-primary/20 animate-fade-in-up">
          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">{t('datetime.selectedDate')}</p>
              <p className="font-medium">{selectedDate.toLocaleDateString()}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">{t('datetime.selectedTime')}</p>
              <p className="font-medium">
                {timeSlots.find(slot => slot.id === selectedTime)?.label}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          {t('back')}
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!canProceed}
          className="group"
        >
          {t('continue')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </div>
      
      {/* Copyright Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">{t('welcome.copyright')}</p>
      </div>
    </div>
  );
}