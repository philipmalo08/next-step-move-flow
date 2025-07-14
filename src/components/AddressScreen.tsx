import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Plus, X, MapPin, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeAddress, checkRateLimit } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/security";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', address: '', type: 'pickup' },
    { id: '2', address: '', type: 'dropoff' }
  ]);
  const [distance, setDistance] = useState<number>(0);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [suggestions, setSuggestions] = useState<{[key: string]: string[]}>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{[key: string]: boolean}>({});
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const updateAddress = (id: string, address: string) => {
    // Sanitize input
    const sanitizedAddress = sanitizeAddress(address);
    
    // Validate length
    if (sanitizedAddress.length > 500) {
      setValidationErrors(prev => ({ ...prev, [id]: 'Address too long' }));
      return;
    }
    
    // Clear validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
    
    setAddresses(prev => prev.map(addr => 
      addr.id === id ? { ...addr, address: sanitizedAddress } : addr
    ));
    
    // Get address suggestions
    if (sanitizedAddress.length > 2) {
      getSuggestions(id, sanitizedAddress);
    } else {
      setSuggestions(prev => ({ ...prev, [id]: [] }));
    }
  };

  const getSuggestions = async (addressId: string, query: string) => {
    if (query.length < 2) return;
    
    // Rate limiting check
    const clientId = 'address_suggestions_' + (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown');
    if (!checkRateLimit(clientId, 30, 60000)) {
      toast({
        title: "Rate limit exceeded",
        description: "Please wait before making more address requests.",
        variant: "destructive",
      });
      logSecurityEvent('address_suggestions_rate_limit_exceeded', { addressId, query: query.substring(0, 50) });
      return;
    }
    
    setLoadingSuggestions(prev => ({ ...prev, [addressId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('maps-api', {
        body: {
          service: 'geocoding',
          address: sanitizeAddress(query) // Remove the automatic ", Canada" addition
        }
      });

      if (error) {
        logSecurityEvent('address_suggestions_api_error', { error: error.message, addressId });
        throw error;
      }

      if (data?.results) {
        const addressSuggestions = data.results
          .map((result: any) => sanitizeAddress(result.formatted_address))
          .slice(0, 5); // Limit to 5 suggestions
        setSuggestions(prev => ({ ...prev, [addressId]: addressSuggestions }));
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get address suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [addressId]: false }));
    }
  };

  const selectSuggestion = (addressId: string, suggestion: string) => {
    setAddresses(prev => prev.map(addr => 
      addr.id === addressId ? { ...addr, address: suggestion } : addr
    ));
    setSuggestions(prev => ({ ...prev, [addressId]: [] }));
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
                <div key={addr.id} className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        id={`address-${addr.id}`}
                        placeholder={index === 0 ? "Enter pickup address" : "Additional pickup location"}
                        value={addr.address}
                        onChange={(e) => updateAddress(addr.id, e.target.value)}
                        className={`text-sm ${validationErrors[addr.id] ? 'border-destructive' : ''}`}
                        maxLength={500}
                      />
                      {validationErrors[addr.id] && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {validationErrors[addr.id]}
                        </div>
                      )}
                      {/* Address Suggestions */}
                      {suggestions[addr.id] && suggestions[addr.id].length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-background border border-border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {suggestions[addr.id].map((suggestion, suggestionIndex) => (
                            <button
                              key={suggestionIndex}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                              onClick={() => selectSuggestion(addr.id, suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      {loadingSuggestions[addr.id] && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {pickupAddresses.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStop(addr.id)}
                        className="h-9 w-9 p-0 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
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
                <div key={addr.id} className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        id={`address-${addr.id}`}
                        placeholder={index === 0 ? "Enter dropoff address" : "Additional dropoff location"}
                        value={addr.address}
                        onChange={(e) => updateAddress(addr.id, e.target.value)}
                        className={`text-sm ${validationErrors[addr.id] ? 'border-destructive' : ''}`}
                        maxLength={500}
                      />
                      {validationErrors[addr.id] && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {validationErrors[addr.id]}
                        </div>
                      )}
                      {/* Address Suggestions */}
                      {suggestions[addr.id] && suggestions[addr.id].length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-background border border-border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {suggestions[addr.id].map((suggestion, suggestionIndex) => (
                            <button
                              key={suggestionIndex}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                              onClick={() => selectSuggestion(addr.id, suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      {loadingSuggestions[addr.id] && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {dropoffAddresses.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStop(addr.id)}
                        className="h-9 w-9 p-0 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
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