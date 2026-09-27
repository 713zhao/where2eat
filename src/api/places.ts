import type { LatLon, PlaceType, Restaurant } from '../types';
import { searchNearbyPlaces } from './nominatimSearch';
import { fetchNearbyRestaurants } from './overpass';
import { fetchNearbyRestaurantsViaProxy } from './overpassProxy';

export interface PlacesResult {
  restaurants: Restaurant[];
  /** Which service the results actually came from. */
  source: 'overpass' | 'overpass-proxy' | 'nominatim';
}

/**
 * Tries Overpass directly first (best coverage, fastest, supports all place
 * types in one query). If that fails - including when a visitor's ISP/network
 * blocks those specific domains outright - retries through our own same-origin
 * proxy (api/overpassProxy.ts), which reaches Overpass from Cloudflare's
 * network instead of the visitor's. If that also fails, falls back to a single
 * Nominatim search (separate OSM infrastructure). Throws the original Overpass
 * error only if all three fail, so callers can fall back to demo data with an
 * accurate error message.
 */
export async function fetchNearbyPlaces(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<PlacesResult> {
  try {
    const restaurants = await fetchNearbyRestaurants(center, radiusMeters, placeTypes);
    return { restaurants, source: 'overpass' };
  } catch (overpassError) {
    try {
      const restaurants = await fetchNearbyRestaurantsViaProxy(center, radiusMeters, placeTypes);
      if (restaurants.length > 0) {
        return { restaurants, source: 'overpass-proxy' };
      }
    } catch {
      // proxy unavailable (e.g. not deployed on this host) or also failed - keep falling back
    }

    const fallback = await searchNearbyPlaces(center, radiusMeters, placeTypes);
    if (fallback.length > 0) {
      return { restaurants: fallback, source: 'nominatim' };
    }
    throw overpassError;
  }
}
