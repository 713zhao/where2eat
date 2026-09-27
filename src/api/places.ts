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
function describe(tag: string, err: unknown): string {
  return `${tag}: ${err instanceof Error ? err.message : String(err)}`;
}

export async function fetchNearbyPlaces(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<PlacesResult> {
  try {
    const restaurants = await fetchNearbyRestaurants(center, radiusMeters, placeTypes);
    return { restaurants, source: 'overpass' };
  } catch (overpassError) {
    const tierErrors = [describe('direct', overpassError)];

    try {
      const restaurants = await fetchNearbyRestaurantsViaProxy(center, radiusMeters, placeTypes);
      if (restaurants.length > 0) {
        return { restaurants, source: 'overpass-proxy' };
      }
      tierErrors.push('proxy: returned no results');
    } catch (proxyError) {
      tierErrors.push(describe('proxy', proxyError));
    }

    try {
      const fallback = await searchNearbyPlaces(center, radiusMeters, placeTypes);
      if (fallback.length > 0) {
        return { restaurants: fallback, source: 'nominatim' };
      }
      tierErrors.push('nominatim: returned no results');
    } catch (nominatimError) {
      tierErrors.push(describe('nominatim', nominatimError));
    }

    throw new Error(tierErrors.join(' || '));
  }
}
