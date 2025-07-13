import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Plus, X, MapPin } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

interface Address {
  id: string;
  address: string;
  type: 'pickup' | 'dropoff';
}

interface AddressScreenProps {
  onNext: (addresses: Address[], distance: number) => void;
  onBack: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export const AddressScreen = ({ onNext, onBack }: AddressScreenProps) => {
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', address: '', type: 'pickup' },
    { id: '2', address: '', type: 'dropoff' }
  ]);
  const [distance, setDistance] = useState<number>(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRefs = useRef<{[key: string]: any}>({});
  const mapInstance = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);

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

  // Load Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyC8Qc9vX3K2mP7nF1wR8dH5jL4yN9uT6eI",
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    loader.load().then(() => {
      setIsMapLoaded(true);
      
      // Initialize autocomplete for existing inputs
      addresses.forEach(addr => {
        initializeAutocomplete(addr.id);
      });
    });
  }, []);

  // Initialize autocomplete for an input
  const initializeAutocomplete = (addressId: string) => {
    if (!isMapLoaded || !window.google) return;

    const input = document.getElementById(`address-${addressId}`) as HTMLInputElement;
    if (!input || autocompleteRefs.current[addressId]) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'ca' } // Limit to Canada only
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        updateAddress(addressId, place.formatted_address);
      }
    });

    autocompleteRefs.current[addressId] = autocomplete;
  };

  // Initialize autocomplete when new addresses are added
  useEffect(() => {
    if (isMapLoaded) {
      addresses.forEach(addr => {
        if (!autocompleteRefs.current[addr.id]) {
          setTimeout(() => initializeAutocomplete(addr.id), 100);
        }
      });
    }
  }, [addresses, isMapLoaded]);

  // Show map and calculate route when both pickup and dropoff are filled
  useEffect(() => {
    const validAddresses = addresses.filter(addr => addr.address.trim());
    const hasPickupAndDropoff = 
      validAddresses.some(addr => addr.type === 'pickup') && 
      validAddresses.some(addr => addr.type === 'dropoff');

    if (hasPickupAndDropoff && isMapLoaded && !showMap) {
      setShowMap(true);
      setTimeout(initializeMap, 100);
    } else if (hasPickupAndDropoff && showMap) {
      calculateRoute();
    }
  }, [addresses, isMapLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 45.5017, lng: -73.5673 }, // Montreal default
    });

    directionsService.current = new window.google.maps.DirectionsService();
    directionsRenderer.current = new window.google.maps.DirectionsRenderer();
    directionsRenderer.current.setMap(mapInstance.current);

    calculateRoute();
  };

  const calculateRoute = () => {
    if (!directionsService.current || !directionsRenderer.current) return;

    const pickup = addresses.find(addr => addr.type === 'pickup' && addr.address.trim());
    const dropoff = addresses.find(addr => addr.type === 'dropoff' && addr.address.trim());

    if (!pickup || !dropoff) return;

    const request = {
      origin: pickup.address,
      destination: dropoff.address,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    directionsService.current.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        directionsRenderer.current.setDirections(result);
        const route = result.routes[0];
        const distanceInMeters = route.legs[0].distance.value;
        const distanceInKm = distanceInMeters / 1000;
        setDistance(distanceInKm);
      }
    });
  };

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

            {/* Map */}
            {showMap && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Route Preview</Label>
                <div 
                  ref={mapRef}
                  className="w-full h-48 rounded-lg border bg-muted"
                />
                {distance > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Estimated distance: {distance.toFixed(1)} km
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