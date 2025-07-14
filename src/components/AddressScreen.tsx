import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Plus, X, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Address {
  id: string;
  address: string;
  type: 'pickup' | 'dropoff';
}

interface AddressScreenProps {
  onNext: (addresses: Address[], distance: number) => void;
  onBack: () => void;
}

export const AddressScreen = ({ onNext, onBack }: AddressScreenProps) => {
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', address: '', type: 'pickup' },
    { id: '2', address: '', type: 'dropoff' }
  ]);
  const [distance, setDistance] = useState<number>(0);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const updateAddress = (id: string, address: string) => {
    setAddresses(prev => prev.map(addr => 
      addr.id === id ? { ...addr, address } : addr
    ));
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

  // Calculate distance when addresses change
  useEffect(() => {
    const calculateDistance = async () => {
      const pickup = addresses.find(addr => addr.type === 'pickup' && addr.address.trim());
      const dropoff = addresses.find(addr => addr.type === 'dropoff' && addr.address.trim());

      if (!pickup || !dropoff) {
        setDistance(0);
        return;
      }

      setIsCalculatingDistance(true);
      try {
        const { data, error } = await supabase.functions.invoke('maps-api', {
          body: {
            service: 'distance',
            origin: pickup.address,
            destination: dropoff.address
          }
        });

        if (error) throw error;

        if (data?.rows?.[0]?.elements?.[0]?.distance?.value) {
          const distanceInMeters = data.rows[0].elements[0].distance.value;
          const distanceInKm = distanceInMeters / 1000;
          setDistance(distanceInKm);
        }
      } catch (error) {
        console.error('Error calculating distance:', error);
        // Fallback: estimate distance based on coordinates if needed
        setDistance(10); // Default estimate
      } finally {
        setIsCalculatingDistance(false);
      }
    };

    const timeoutId = setTimeout(calculateDistance, 1000); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [addresses]);

  return (
    <div className="min-h-screen bg-gradient-background px-4 py-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl sm:text-2xl">Where are we moving?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pickup Addresses */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <Label className="text-sm font-semibold">Pickup Location{pickupAddresses.length > 1 ? 's' : ''}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStop('pickup')}
                  className="ml-auto h-7 w-7 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              {pickupAddresses.map((addr, index) => (
                <div key={addr.id} className="flex gap-2">
                  <Input
                    id={`address-${addr.id}`}
                    placeholder={index === 0 ? "Enter pickup address" : "Additional pickup location"}
                    value={addr.address}
                    onChange={(e) => updateAddress(addr.id, e.target.value)}
                    className="text-sm"
                  />
                  {pickupAddresses.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeStop(addr.id)}
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Dropoff Addresses */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <Label className="text-sm font-semibold">Dropoff Location{dropoffAddresses.length > 1 ? 's' : ''}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStop('dropoff')}
                  className="ml-auto h-7 w-7 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              {dropoffAddresses.map((addr, index) => (
                <div key={addr.id} className="flex gap-2">
                  <Input
                    id={`address-${addr.id}`}
                    placeholder={index === 0 ? "Enter dropoff address" : "Additional dropoff location"}
                    value={addr.address}
                    onChange={(e) => updateAddress(addr.id, e.target.value)}
                    className="text-sm"
                  />
                  {dropoffAddresses.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeStop(addr.id)}
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Distance Display */}
            {distance > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium">
                  Estimated distance: {distance.toFixed(1)} km
                </p>
                {isCalculatingDistance && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculating route...
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => onNext(addresses, distance)}
                disabled={!canProceed}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Copyright Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">© 2021 Next Movement. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};