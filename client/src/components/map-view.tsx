import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";

// Helper functions to position markers based on major Swedish cities
const getSwedenCityPosition = (index: number, total: number) => {
  // Positions representing major Swedish cities (Stockholm, Göteborg, Malmö, Uppsala, etc.)
  const swedenCities = [
    { top: 35, left: 65 }, // Stockholm area
    { top: 55, left: 25 }, // Göteborg area  
    { top: 85, left: 35 }, // Malmö area
    { top: 30, left: 60 }, // Uppsala area
    { top: 45, left: 45 }, // Örebro area
    { top: 40, left: 30 }, // Jönköping area
    { top: 25, left: 55 }, // Gävle area
    { top: 15, left: 50 }, // Sundsvall area
  ];
  
  return swedenCities[index % swedenCities.length];
};

const getSwedenVenuePosition = (index: number, total: number) => {
  // Venue positions spread across Swedish urban areas
  const venuePositions = [
    { top: 37, left: 67 }, // Stockholm venues
    { top: 33, left: 63 }, // Stockholm suburbs
    { top: 57, left: 27 }, // Göteborg venues
    { top: 53, left: 23 }, // Göteborg suburbs
    { top: 87, left: 37 }, // Malmö venues
    { top: 83, left: 33 }, // Malmö area
    { top: 32, left: 62 }, // Uppsala venues
    { top: 47, left: 47 }, // Central Sweden
  ];
  
  return venuePositions[index % venuePositions.length];
};

interface MapViewProps {
  venues: any[];
  challenges: any[];
  onMarkerClick?: (item: any) => void;
}

export function MapView({ venues, challenges, onMarkerClick }: MapViewProps) {
  const [zoom, setZoom] = useState(1);
  const { latitude, longitude, error } = useGeolocation();

  // Mock map implementation - in production, use Leaflet or similar
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  const mapStyle = {
    transform: `scale(${zoom})`,
    transformOrigin: 'center',
    transition: 'transform 0.3s ease'
  };

  return (
    <div className="relative h-64 bg-muted rounded-xl overflow-hidden" data-testid="container-map-view">
      {/* Swedish map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-green-200">
        <div 
          className="w-full h-full bg-cover bg-center opacity-50"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')",
            ...mapStyle
          }}
        />
      </div>
      
      {/* Sweden-themed overlay with subtle Nordic colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-yellow-500/10" />
      
      {/* Stylized Sweden outline (decorative) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="text-8xl text-gray-600">
          <i className="fas fa-map"></i>
        </div>
      </div>
      
      {/* Challenge markers - positioned across Sweden */}
      {challenges.map((challenge, index) => (
        <div 
          key={challenge.id}
          className={`absolute bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold animate-pulse cursor-pointer hover:scale-110 transition-transform shadow-lg`}
          style={{
            // Position markers to represent major Swedish cities
            top: `${getSwedenCityPosition(index, challenges.length).top}%`,
            left: `${getSwedenCityPosition(index, challenges.length).left}%`,
            transform: `scale(${zoom})`
          }}
          onClick={() => onMarkerClick?.(challenge)}
          data-testid={`marker-challenge-${challenge.id}`}
        >
          {Math.min(challenge.participantCount || 1, 9)}
        </div>
      ))}

      {/* Venue markers - positioned in Swedish cities */}
      {venues.map((venue, index) => (
        <div 
          key={venue.id}
          className={`absolute bg-secondary text-secondary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform shadow-md`}
          style={{
            top: `${getSwedenVenuePosition(index, venues.length).top}%`,
            left: `${getSwedenVenuePosition(index, venues.length).left}%`,
            transform: `scale(${zoom})`
          }}
          onClick={() => onMarkerClick?.(venue)}
          data-testid={`marker-venue-${venue.id}`}
        >
          <i className="fas fa-map-marker-alt text-xs"></i>
        </div>
      ))}

      {/* User location marker (if available) */}
      {latitude && longitude && (
        <div 
          className="absolute bg-accent text-accent-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${zoom})`
          }}
          data-testid="marker-user-location"
        >
          <i className="fas fa-user text-xs"></i>
        </div>
      )}
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-background/90 backdrop-blur border border-border"
          onClick={handleZoomIn}
          data-testid="button-map-zoom-in"
        >
          <i className="fas fa-plus text-sm"></i>
        </Button>
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-background/90 backdrop-blur border border-border"
          onClick={handleZoomOut}
          data-testid="button-map-zoom-out"
        >
          <i className="fas fa-minus text-sm"></i>
        </Button>
      </div>

      {/* Location error display */}
      {error && (
        <div className="absolute bottom-4 left-4 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">
          Location unavailable
        </div>
      )}
    </div>
  );
}
