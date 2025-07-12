import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Plus, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  address: string;
  type: 'pickup' | 'dropoff';
}

interface AddressScreenProps {
  onNext: (addresses: Address[]) => void;
  onBack: () => void;
}

export function AddressScreen({ onNext, onBack }: AddressScreenProps) {
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', address: '', type: 'pickup' },
    { id: '2', address: '', type: 'dropoff' }
  ]);

  const [distance, setDistance] = useState<string>('');

  const updateAddress = (id: string, address: string) => {
    setAddresses(prev => prev.map(addr => 
      addr.id === id ? { ...addr, address } : addr
    ));
    
    // Simulate distance calculation
    if (address && addresses.find(a => a.id !== id && a.address)) {
      setDistance('12.5 km');
    }
  };

  const addStop = (type: 'pickup' | 'dropoff') => {
    const newId = Date.now().toString();
    setAddresses(prev => [...prev, { id: newId, address: '', type }]);
  };

  const removeStop = (id: string) => {
    if (addresses.length > 2) {
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    }
  };

  const canProceed = addresses.filter(addr => addr.address.trim()).length >= 2;

  const pickupAddresses = addresses.filter(addr => addr.type === 'pickup');
  const dropoffAddresses = addresses.filter(addr => addr.type === 'dropoff');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Where are we moving?</h2>
        <p className="text-muted-foreground">Enter your pickup and drop-off locations</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Pickup Locations */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Pickup Locations</h3>
          </div>
          
          <div className="space-y-3">
            {pickupAddresses.map((addr, index) => (
              <div key={addr.id} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={index === 0 ? "Main pickup address" : "Additional pickup"}
                    value={addr.address}
                    onChange={(e) => updateAddress(addr.id, e.target.value)}
                    className="w-full"
                  />
                </div>
                {pickupAddresses.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeStop(addr.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={() => addStop('pickup')}
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              Add pickup stop
            </Button>
          </div>
        </Card>

        {/* Drop-off Locations */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-success rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Drop-off Locations</h3>
          </div>
          
          <div className="space-y-3">
            {dropoffAddresses.map((addr, index) => (
              <div key={addr.id} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={index === 0 ? "Main drop-off address" : "Additional drop-off"}
                    value={addr.address}
                    onChange={(e) => updateAddress(addr.id, e.target.value)}
                    className="w-full"
                  />
                </div>
                {dropoffAddresses.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeStop(addr.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={() => addStop('dropoff')}
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              Add drop-off stop
            </Button>
          </div>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card className="p-6 shadow-soft">
        <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Route will appear here</p>
            {distance && (
              <p className="text-sm text-primary font-medium mt-2">
                Estimated distance: {distance}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={() => onNext(addresses)}
          disabled={!canProceed}
          className="group"
        >
          Continue
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </div>
    </div>
  );
}