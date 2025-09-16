import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GAME_ICONS, GAME_COLORS } from '@/lib/constants';

// Fix Leaflet default marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RealMapProps {
  venues: any[];
  challenges: any[];
  userLocation?: { lat: number; lng: number };
  onMarkerClick?: (item: any) => void;
  className?: string;
  showDistanceRings?: boolean;
  gpsAccuracy?: number;
  onCheckInSuccess?: () => void;
  realTimeUpdates?: boolean;
}

export function RealMap({ 
  venues, 
  challenges, 
  userLocation, 
  onMarkerClick, 
  className = "h-64",
  showDistanceRings = true,
  gpsAccuracy,
  onCheckInSuccess,
  realTimeUpdates = true
}: RealMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const distanceRingsRef = useRef<L.LayerGroup | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  
  // Marker tracking for incremental updates
  const venueMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const challengeMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const distanceRingsArrayRef = useRef<L.Circle[]>([]);
  const lastUserLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  
  const [newChallenges, setNewChallenges] = useState<Set<string>>(new Set());
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Create custom marker icons
  const createGameMarker = (challenge: any) => {
    const gameIcon = GAME_ICONS[challenge.preset] || GAME_ICONS.default;
    const gameColor = GAME_COLORS[challenge.preset] || GAME_COLORS.default;
    const isNew = newChallenges.has(challenge.id);
    
    return L.divIcon({
      className: 'custom-game-marker',
      html: `
        <div class="relative">
          <div class="w-12 h-12 bg-gradient-to-br ${gameColor} rounded-full flex items-center justify-center text-white shadow-lg border-3 border-white ${isNew ? 'animate-pulse' : ''} transition-[transform,box-shadow] duration-300 hover:scale-110">
            <i class="${gameIcon} text-lg"></i>
          </div>
          ${isNew ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>' : ''}
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-xs px-2 py-1 rounded-full border shadow-sm font-semibold">
            ${challenge.participantCount || 0}/${challenge.maxParticipants}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24]
    });
  };

  const createVenueMarker = (venue: any, distance?: number) => {
    const distanceColor = distance ? 
      distance <= 500 ? 'bg-green-500' : 
      distance <= 1000 ? 'bg-yellow-500' : 'bg-red-500' 
      : 'bg-blue-500';
    
    return L.divIcon({
      className: 'custom-venue-marker',
      html: `
        <div class="relative">
          <div class="w-8 h-8 ${distanceColor} rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition-[transform,box-shadow] duration-300 hover:scale-110">
            <i class="fas fa-map-marker-alt text-xs"></i>
          </div>
          ${distance ? `<div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">${distance}m</div>` : ''}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const createUserMarker = (accuracy?: number) => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative">
          <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-3 border-white">
            <i class="fas fa-user text-sm"></i>
          </div>
          <div class="absolute inset-0 w-10 h-10 bg-blue-400/30 rounded-full opacity-50"></div>
          ${accuracy ? `<div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            ±${Math.round(accuracy)}m
          </div>` : ''}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Memoized distance calculation for performance
  const calculateDistance = useMemo(() => {
    return (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371000; // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
  }, []);

  // Check if user location has moved significantly (200m threshold)
  const hasUserLocationChanged = useCallback((newLocation: { lat: number; lng: number } | undefined) => {
    if (!newLocation || !lastUserLocationRef.current) return true;
    const distance = calculateDistance(
      lastUserLocationRef.current.lat, lastUserLocationRef.current.lng,
      newLocation.lat, newLocation.lng
    );
    return distance > 200; // 200m threshold
  }, [calculateDistance]);

  // Batch updates with requestAnimationFrame to prevent excessive DOM manipulation
  const scheduleUpdate = useCallback((updateFn: () => void) => {
    if (updateTimeoutRef.current) {
      cancelAnimationFrame(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = requestAnimationFrame(() => {
      updateFn();
      updateTimeoutRef.current = null;
    });
  }, []);

  // Update distance rings incrementally
  const updateDistanceRings = useCallback(() => {
    if (!mapInstanceRef.current || !distanceRingsRef.current) return;

    // Clear existing rings
    distanceRingsArrayRef.current.forEach(ring => {
      if (distanceRingsRef.current!.hasLayer(ring)) {
        distanceRingsRef.current!.removeLayer(ring);
      }
    });
    distanceRingsArrayRef.current = [];

    if (userLocation && showDistanceRings) {
      const distances = [500, 1000, 2000]; // meters
      const colors = ['#22c55e', '#eab308', '#ef4444']; // green, yellow, red
      
      distances.forEach((distance, index) => {
        const circle = L.circle([userLocation.lat, userLocation.lng], {
          radius: distance,
          fillColor: colors[index],
          fillOpacity: 0.1,
          color: colors[index],
          weight: 2,
          opacity: 0.6
        });
        distanceRingsRef.current!.addLayer(circle);
        distanceRingsArrayRef.current.push(circle);
      });
    }
  }, [userLocation, showDistanceRings]);

  // Update venue markers incrementally
  const updateVenueMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    const currentVenueIds = new Set(venues.map(v => v.id).filter(Boolean));
    const existingVenueIds = new Set(venueMarkersRef.current.keys());

    // Remove markers for venues that no longer exist
    existingVenueIds.forEach(venueId => {
      if (!currentVenueIds.has(venueId)) {
        const marker = venueMarkersRef.current.get(venueId);
        if (marker && markersRef.current!.hasLayer(marker)) {
          markersRef.current!.removeLayer(marker);
        }
        venueMarkersRef.current.delete(venueId);
      }
    });

    // Add or update markers for current venues
    venues.forEach((venue) => {
      if (!venue.lat || !venue.lng || !venue.id) return;

      let distance;
      if (userLocation) {
        distance = Math.round(calculateDistance(
          userLocation.lat, userLocation.lng,
          parseFloat(venue.lat), parseFloat(venue.lng)
        ));
      }

      const existingMarker = venueMarkersRef.current.get(venue.id);
      
      // Check if marker needs updating (position or distance changed)
      const needsUpdate = !existingMarker || 
        (existingMarker.getLatLng().lat !== parseFloat(venue.lat)) ||
        (existingMarker.getLatLng().lng !== parseFloat(venue.lng));

      if (needsUpdate) {
        // Remove existing marker
        if (existingMarker && markersRef.current!.hasLayer(existingMarker)) {
          markersRef.current!.removeLayer(existingMarker);
        }

        // Create new marker
        const marker = L.marker([parseFloat(venue.lat), parseFloat(venue.lng)], {
          icon: createVenueMarker(venue, distance)
        })
          .bindPopup(`
            <div class="p-3 min-w-48">
              <h4 class="font-semibold text-lg mb-1">${venue.name}</h4>
              <p class="text-sm text-gray-600 mb-1">${venue.category}</p>
              <p class="text-xs text-gray-500 mb-2">${venue.address}</p>
              ${venue.rating ? `<div class="flex items-center text-xs mb-2"><i class="fas fa-star text-yellow-500 mr-1"></i> ${venue.rating}/5.0</div>` : ''}
              ${distance ? `<div class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📍 ${distance}m away</div>` : ''}
            </div>
          `)
          .on('click', () => onMarkerClick?.(venue));

        markersRef.current!.addLayer(marker);
        venueMarkersRef.current.set(venue.id, marker);
      }
    });
  }, [venues, userLocation, calculateDistance, createVenueMarker, onMarkerClick]);

  // Update challenge markers incrementally
  const updateChallengeMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    const currentChallengeIds = new Set(challenges.map(c => c.id).filter(Boolean));
    const existingChallengeIds = new Set(challengeMarkersRef.current.keys());

    // Remove markers for challenges that no longer exist
    existingChallengeIds.forEach(challengeId => {
      if (!currentChallengeIds.has(challengeId)) {
        const marker = challengeMarkersRef.current.get(challengeId);
        if (marker && markersRef.current!.hasLayer(marker)) {
          markersRef.current!.removeLayer(marker);
        }
        challengeMarkersRef.current.delete(challengeId);
      }
    });

    // Add or update markers for current challenges
    challenges.forEach((challenge) => {
      if (!challenge.venue?.lat || !challenge.venue?.lng || !challenge.id) return;

      const existingMarker = challengeMarkersRef.current.get(challenge.id);
      
      // Check if marker needs updating (position or status changed)
      const needsUpdate = !existingMarker || 
        (existingMarker.getLatLng().lat !== parseFloat(challenge.venue.lat)) ||
        (existingMarker.getLatLng().lng !== parseFloat(challenge.venue.lng)) ||
        newChallenges.has(challenge.id); // Always update if challenge is new

      if (needsUpdate) {
        // Remove existing marker
        if (existingMarker && markersRef.current!.hasLayer(existingMarker)) {
          markersRef.current!.removeLayer(existingMarker);
        }

        // Create new marker
        const marker = L.marker([parseFloat(challenge.venue.lat), parseFloat(challenge.venue.lng)], { 
          icon: createGameMarker(challenge)
        })
          .bindPopup(`
            <div class="p-3 min-w-48">
              <h4 class="font-semibold text-lg mb-2">${challenge.title}</h4>
              <div class="flex items-center mb-2">
                <i class="${GAME_ICONS[challenge.preset] || GAME_ICONS.default} mr-2 text-blue-600"></i>
                <span class="text-sm font-medium">${challenge.preset}</span>
              </div>
              <p class="text-xs text-gray-600 mb-2">📍 ${challenge.venue.name}</p>
              <div class="flex justify-between text-xs mb-2">
                <span>👥 ${challenge.participantCount || 0}/${challenge.maxParticipants} players</span>
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">${challenge.status}</span>
              </div>
              <p class="text-xs text-gray-500">🕐 ${new Date(challenge.startAt).toLocaleString()}</p>
            </div>
          `)
          .on('click', () => onMarkerClick?.(challenge));

        markersRef.current!.addLayer(marker);
        challengeMarkersRef.current.set(challenge.id, marker);
      }
    });
  }, [challenges, newChallenges, createGameMarker, onMarkerClick]);

  // Update user marker incrementally
  const updateUserMarker = useCallback(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    // Remove existing user marker
    if (userMarkerRef.current && markersRef.current.hasLayer(userMarkerRef.current)) {
      markersRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Add new user marker if location exists
    if (userLocation) {
      const marker = L.marker([userLocation.lat, userLocation.lng], { 
        icon: createUserMarker(gpsAccuracy)
      })
        .bindPopup(`
          <div class="p-2 text-center">
            <h4 class="font-semibold text-blue-600">📍 Your Location</h4>
            ${gpsAccuracy ? `<p class="text-xs text-gray-500 mt-1">Accuracy: ±${Math.round(gpsAccuracy)}m</p>` : ''}
            ${checkInSuccess ? '<p class="text-xs text-green-600 font-semibold mt-1">✅ Check-in successful!</p>' : ''}
          </div>
        `);

      markersRef.current.addLayer(marker);
      userMarkerRef.current = marker;
    }
  }, [userLocation, gpsAccuracy, checkInSuccess, createUserMarker]);

  // Update GPS accuracy circle
  const updateAccuracyCircle = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing accuracy circle
    if (accuracyCircleRef.current) {
      mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }

    // Add new accuracy circle if GPS accuracy is available
    if (userLocation && gpsAccuracy) {
      accuracyCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: gpsAccuracy,
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        color: '#3b82f6',
        weight: 1,
        opacity: 0.8
      });
      mapInstanceRef.current.addLayer(accuracyCircleRef.current);
    }
  }, [userLocation, gpsAccuracy]);

  // Initialize map (only once)
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Göteborg, Sweden
    const map = L.map(mapRef.current).setView([57.7089, 11.9746], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    distanceRingsRef.current = L.layerGroup().addTo(map);

    return () => {
      if (updateTimeoutRef.current) {
        cancelAnimationFrame(updateTimeoutRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Detect new challenges for pulse animation
  useEffect(() => {
    if (realTimeUpdates) {
      const challengeIds = challenges.map(c => c.id);
      const previousIds = Array.from(newChallenges);
      const newIds = challengeIds.filter(id => !previousIds.includes(id));
      
      if (newIds.length > 0) {
        setNewChallenges(new Set(newIds));
        // Remove new status after animation
        setTimeout(() => {
          setNewChallenges(prev => {
            const updated = new Set(prev);
            newIds.forEach(id => updated.delete(id));
            return updated;
          });
        }, 3000);
      }
    }
  }, [challenges, realTimeUpdates]);

  // Check-in success animation
  useEffect(() => {
    if (onCheckInSuccess) {
      setCheckInSuccess(true);
      setTimeout(() => setCheckInSuccess(false), 2000);
    }
  }, [onCheckInSuccess]);

  // Update user location and distance rings (throttled)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    scheduleUpdate(() => {
      updateDistanceRings();
      updateAccuracyCircle();
      updateUserMarker();

      // Only update map view if user location has changed significantly
      if (userLocation && hasUserLocationChanged(userLocation)) {
        mapInstanceRef.current!.setView([userLocation.lat, userLocation.lng], 14);
        lastUserLocationRef.current = userLocation;
      }

      // Auto-fit map to show all markers if no user location (first time only)
      if (!userLocation && !lastUserLocationRef.current && (venues.length > 0 || challenges.length > 0)) {
        const group = new L.FeatureGroup(markersRef.current!.getLayers() as L.Layer[]);
        if (group.getBounds().isValid()) {
          mapInstanceRef.current!.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
      }
    });
  }, [userLocation, showDistanceRings, gpsAccuracy, checkInSuccess, scheduleUpdate, updateDistanceRings, updateAccuracyCircle, updateUserMarker, hasUserLocationChanged, venues.length, challenges.length]);

  // Update venue markers (incremental)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    scheduleUpdate(updateVenueMarkers);
  }, [venues, userLocation, updateVenueMarkers, scheduleUpdate]);

  // Update challenge markers (incremental)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    scheduleUpdate(updateChallengeMarkers);
  }, [challenges, newChallenges, updateChallengeMarkers, scheduleUpdate]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className={`${className} rounded-xl overflow-hidden border border-border`}
        data-testid="real-map-container"
      />
      
      {/* GPS Accuracy Indicator */}
      {gpsAccuracy && (
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs shadow-md">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              gpsAccuracy <= 10 ? 'bg-green-500' :
              gpsAccuracy <= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">GPS: ±{Math.round(gpsAccuracy)}m</span>
          </div>
        </div>
      )}
      
      {/* Check-in Success Animation */}
      {checkInSuccess && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-xl"></i>
              <span className="font-semibold">Location Confirmed!</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Distance Legend */}
      {showDistanceRings && userLocation && (
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs shadow-md">
          <div className="font-semibold mb-1">Distance</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>≤ 500m</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>≤ 1km</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>&gt; 1km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS styles for custom markers (injected automatically)
const customMarkerStyles = `
.custom-game-marker,
.custom-venue-marker,
.custom-user-marker {
  background: transparent !important;
  border: none !important;
}

.leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.leaflet-popup-tip {
  background-color: white;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customMarkerStyles;
  if (!document.head.querySelector('[data-map-styles]')) {
    styleElement.setAttribute('data-map-styles', 'true');
    document.head.appendChild(styleElement);
  }
}