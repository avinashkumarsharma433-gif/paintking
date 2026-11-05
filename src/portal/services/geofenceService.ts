import { GeofenceTarget, LocationStamp } from '../types/hrAttendanceTypes';

// Official PaintKing Units
export const PAINTKING_LOCATIONS: GeofenceTarget[] = [
  {
    id: 'mumbai-hq',
    name: 'Mumbai Head Office & R&D Lab',
    address: 'Plot 42, Charkop Industrial Estate, Kandivali West, Mumbai 400067',
    lat: 19.2094833,
    lng: 72.8256194,
    radiusMeters: 300, // 300 meter radius
  },
  {
    id: 'haridwar-unit',
    name: 'Haridwar Integrated Manufacturing Unit',
    address: 'Plot 18, Sector 3, IIE SIDCUL, Haridwar, Uttarakhand 249403',
    lat: 29.9457,
    lng: 78.1642,
    radiusMeters: 500, // 500 meter industrial plot radius
  },
];

/**
 * Calculates straight line surface distance between two GPS coordinates using Haversine formula
 * Returns distance in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Requests device GPS and verifies whether it falls within the authorized PaintKing boundary
 */
export async function getVerifiedDeviceLocation(
  targetLocationId: string = 'mumbai-hq',
  bypassForDev: boolean = false
): Promise<{
  stamp: LocationStamp;
  error?: string;
}> {
  const target =
    PAINTKING_LOCATIONS.find((l) => l.id === targetLocationId) ||
    PAINTKING_LOCATIONS[0];

  if (bypassForDev) {
    return {
      stamp: {
        lat: target.lat,
        lng: target.lng,
        accuracy: 10,
        distanceToHQ: 12,
        isHQVerified: true,
        locationName: `${target.name} (Dev Bypass Mode)`,
      },
    };
  }

  if (!navigator.geolocation) {
    return {
      stamp: {
        lat: 0,
        lng: 0,
        accuracy: 0,
        distanceToHQ: 999999,
        isHQVerified: false,
        locationName: 'Geolocation Unsupported',
      },
      error: 'Geolocation is not supported by your browser.',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const distance = calculateHaversineDistance(
          latitude,
          longitude,
          target.lat,
          target.lng
        );
        const isVerified = distance <= target.radiusMeters;

        resolve({
          stamp: {
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            distanceToHQ: distance,
            isHQVerified: isVerified,
            locationName: target.name,
          },
          error: isVerified
            ? undefined
            : `Outside permitted perimeter! You are ${distance}m away from ${target.name} (Max allowed: ${target.radiusMeters}m).`,
        });
      },
      (err) => {
        let msg = 'Unable to acquire GPS location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow GPS access to record attendance.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please check device GPS.';
        }
        resolve({
          stamp: {
            lat: 0,
            lng: 0,
            accuracy: 0,
            distanceToHQ: 999999,
            isHQVerified: false,
            locationName: target.name,
          },
          error: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  });
}
