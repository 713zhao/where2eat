import type { LatLon, PlaceType, Restaurant } from '../types';
import { haversineMeters } from '../utils/geo';

const ENDPOINT = '/api/places';
const REQUEST_TIMEOUT_MS = 10000;

/** Thrown when no Google Places API key is configured - callers should skip this tier silently. */
export class GooglePlacesNotConfiguredError extends Error {}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  rating?: number;
  formattedAddress?: string;
  primaryType?: string;
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
}

// Google Places (New) type -> our PlaceType, for display purposes.
const GOOGLE_TYPE_TO_OURS: Record<string, PlaceType> = {
  restaurant: 'restaurant',
  fast_food_restaurant: 'fast_food',
  cafe: 'cafe',
  bar: 'pub',
  food_court: 'food_court',
};

/**
 * Best-quality tier, tried first when configured (see api/places.ts). Proxies
 * through functions/api/places.ts, which holds the Google Places API key
 * server-side. Throws GooglePlacesNotConfiguredError when no key is set up -
 * that's an expected, normal state (not a failure), so callers should fall
 * through to the OSM-based chain without surfacing an error for it.
 */
export async function fetchNearbyRestaurantsFromGoogle(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<Restaurant[]> {
  if (placeTypes.length === 0) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: center.lat, lon: center.lon, radiusMeters, placeTypes }),
      signal: controller.signal,
    });

    if (response.status === 501) {
      throw new GooglePlacesNotConfiguredError('no API key configured');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const detail = body && typeof body === 'object' && 'error' in body ? String(body.error) : null;
      throw new Error(`status ${response.status}${detail ? ` (${detail})` : ''}`);
    }

    const data: GooglePlacesResponse = await response.json();
    const restaurants = (data.places ?? [])
      .map((place): Restaurant | null => {
        const lat = place.location?.latitude;
        const lon = place.location?.longitude;
        const name = place.displayName?.text;
        if (lat == null || lon == null || !name) return null;

        return {
          id: `google-${place.id}`,
          name,
          amenity: GOOGLE_TYPE_TO_OURS[place.primaryType ?? ''] ?? 'restaurant',
          lat,
          lon,
          distanceMeters: haversineMeters(center, { lat, lon }),
          address: place.formattedAddress,
          rating: place.rating,
        };
      })
      .filter((r): r is Restaurant => r !== null && r.distanceMeters <= radiusMeters);

    restaurants.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return restaurants;
  } finally {
    clearTimeout(timeout);
  }
}
