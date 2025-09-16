import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Sparkles, Eye, Navigation, Gamepad2 } from "lucide-react";

interface ARVenueDiscoveryProps {
  onNavigate: (page: string, data?: any) => void;
}

export function ARVenueDiscovery({ onNavigate }: ARVenueDiscoveryProps) {
  const nearbyVenues = [
    {
      id: 1,
      name: "The Gaming Lounge",
      distance: "0.2 km",
      direction: "North",
      specialty: "Pool & Darts",
      rating: 4.5,
      activeChallenge: true,
      arEnabled: true
    },
    {
      id: 2,
      name: "Chess Masters Club",
      distance: "0.5 km", 
      direction: "East",
      specialty: "Chess & Board Games",
      rating: 4.8,
      activeChallenge: false,
      arEnabled: true
    }
  ];

  const arFeatures = [
    "Real-time venue information overlay",
    "Challenge notifications when nearby",
    "Virtual direction guidance",
    "Live player count display"
  ];

  return (
    <Card className="p-4" data-testid="card-ar-venue-discovery">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white animate-slow-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" data-testid="text-ar-discovery-title">
              AR Venue Discovery
            </h3>
            <p className="text-xs text-muted-foreground" data-testid="text-ar-discovery-subtitle">
              Use your camera to find nearby venues
            </p>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          data-testid="badge-ar-beta"
        >
          BETA
        </Badge>
      </div>

      {/* AR Camera Button */}
      <Button 
        className="w-full mb-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        onClick={() => onNavigate('ar-camera')}
        data-testid="button-start-ar-camera"
      >
        <Eye className="w-4 h-4 mr-2" />
        Start AR Camera
      </Button>

      {/* Nearby Venues */}
      <div className="space-y-3 mb-4">
        <h4 className="text-xs font-medium text-muted-foreground">Nearby AR-Enabled Venues</h4>
        {nearbyVenues.map((venue) => (
          <div 
            key={venue.id} 
            className="p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-muted cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onNavigate('venue-detail', venue)}
            data-testid={`card-ar-venue-${venue.id}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-xs" data-testid="text-venue-name">
                    {venue.name}
                  </h5>
                  <p className="text-xs text-muted-foreground" data-testid="text-venue-specialty">
                    {venue.specialty}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium" data-testid="text-venue-distance">
                  {venue.distance}
                </div>
                <div className="text-xs text-muted-foreground" data-testid="text-venue-direction">
                  {venue.direction}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-yellow-500">★</span>
                  <span className="text-xs" data-testid="text-venue-rating">{venue.rating}</span>
                </div>
                {venue.activeChallenge && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    data-testid="badge-active-challenge"
                  >
                    Live Challenge
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('ar-directions', venue);
                }}
                data-testid="button-ar-directions"
              >
                <Navigation className="w-3 h-3 mr-1" />
                AR Guide
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* AR Features Preview */}
      <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-medium" data-testid="text-ar-features-title">
            AR Features
          </span>
        </div>
        <ul className="space-y-1">
          {arFeatures.slice(0, 2).map((feature, index) => (
            <li 
              key={index} 
              className="text-xs text-muted-foreground flex items-center space-x-2"
              data-testid={`text-ar-feature-${index}`}
            >
              <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}