import React, { useEffect, useRef } from "react";

interface Address {
  id: string;
  address: string;
  type: 'pickup' | 'dropoff';
}

interface AddressMapProps {
  addresses: Address[];
  distance: number;
  className?: string;
}

// Simple type definitions for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        Geocoder: any;
        DirectionsService: any;
        DirectionsRenderer: any;
        Marker: any;
        TravelMode: any;
        SymbolPath: any;
        MapTypeId: any;
      };
    };
  }
}

export const AddressMap: React.FC<AddressMapProps> = ({ addresses, distance, className = "" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const pickup = addresses.find(addr => addr.type === 'pickup' && addr.address.trim());
    const dropoff = addresses.find(addr => addr.type === 'dropoff' && addr.address.trim());

    if (!pickup || !dropoff) return;

    try {
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 11,
        center: { lat: 45.5017, lng: -73.5673 }, // Montreal center
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Create directions service and renderer
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
      });

      directionsRenderer.setMap(map);

      // Calculate and display route
      directionsService.route({
        origin: pickup.address,
        destination: dropoff.address,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'CA'
      }, (result: any, status: string) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          
          // Add custom markers for pickup and dropoff
          const route = result.routes[0];
          const leg = route.legs[0];
          
          // Pickup marker (green)
          new window.google.maps.Marker({
            position: leg.start_location,
            map: map,
            title: 'Pickup Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#16a34a',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
          
          // Dropoff marker (red)
          new window.google.maps.Marker({
            position: leg.end_location,
            map: map,
            title: 'Dropoff Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#dc2626',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
        } else {
          console.error('Directions request failed:', status);
          
          // Fallback: just show the map centered on Montreal
          map.setCenter({ lat: 45.5017, lng: -73.5673 });
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [addresses]);

  // Load Google Maps script if not already loaded
  useEffect(() => {
    if (window.google?.maps) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA2CIVa3xLSb0EzCf-JBTD_L24uz24NsKA&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    const onLoad = () => {
      // Script loaded, component will re-render and initialize map
    };
    
    const onError = () => {
      console.error('Failed to load Google Maps script');
    };
    
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={`bg-muted rounded-lg overflow-hidden ${className}`}>
      <div className="p-3 bg-background border-b">
        <h4 className="font-medium text-sm">Route Overview</h4>
        {distance > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Distance: {distance.toFixed(1)} km
          </p>
        )}
      </div>
      <div ref={mapRef} className="w-full h-48" />
    </div>
  );
};