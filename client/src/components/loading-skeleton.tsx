import { Card, CardContent } from "@/components/ui/card";

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-muted rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
          <div className="h-6 bg-muted-foreground/20 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="h-5 bg-muted rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="w-6 h-6 bg-muted rounded-full"></div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-8 bg-muted rounded w-20"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MapSkeleton() {
  return (
    <div className="h-64 bg-muted rounded-xl animate-pulse flex items-center justify-center">
      <div className="text-muted-foreground">
        <i className="fas fa-map text-2xl"></i>
        <p className="mt-2 text-sm">Loading map...</p>
      </div>
    </div>
  );
}

export function VenueCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="h-5 bg-muted rounded mb-2 w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  );
}