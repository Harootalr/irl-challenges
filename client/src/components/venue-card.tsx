import { Card } from "@/components/ui/card";

interface Venue {
  id: string;
  name: string;
  address: string;
  rating: string;
  activeChallenges?: number;
  distance?: string;
  category: string;
}

interface VenueCardProps {
  venue: Venue;
  onClick: () => void;
}

export function VenueCard({ venue, onClick }: VenueCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sports bar':
        return 'fas fa-beer';
      case 'board game cafe':
        return 'fas fa-chess';
      case 'gaming center':
        return 'fas fa-gamepad';
      default:
        return 'fas fa-map-marker-alt';
    }
  };

  const categoryIcon = getCategoryIcon(venue.category);

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
      data-testid={`card-venue-${venue.id}`}
    >
      <div className="flex">
        <div className="w-20 h-20 bg-muted flex items-center justify-center">
          <i className={`${categoryIcon} text-2xl text-muted-foreground`}></i>
        </div>
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-sm truncate" data-testid="text-venue-name">
              {venue.name}
            </h3>
            <div className="flex items-center text-xs text-accent ml-2">
              <i className="fas fa-star mr-1"></i>
              <span data-testid="text-venue-rating">{venue.rating}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mb-2 truncate" data-testid="text-venue-address">
            {venue.address}
          </p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-muted-foreground">
              {venue.distance && (
                <span data-testid="text-venue-distance">
                  <i className="fas fa-walking mr-1"></i>{venue.distance}
                </span>
              )}
              <span data-testid="text-venue-category">
                <i className={`${categoryIcon} mr-1`}></i>
                {venue.category}
              </span>
            </div>
            <span className="text-accent font-medium" data-testid="text-active-challenges">
              {venue.activeChallenges || 0} active
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
