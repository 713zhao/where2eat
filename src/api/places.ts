import type { LatLon, PlaceType, Restaurant } from '../types';
import { fetchNearbyRestaurantsFromGoogle, GooglePlacesNotConfiguredError } from './googlePlaces';
import { searchNearbyPlaces } from './nominatimSearch';
import { fetchNearbyRestaurants } from './overpass';
import { fetchNearbyRestaurantsViaProxy } from './overpassProxy';

export interface PlacesResult {
  restaurants: Restaurant[];
  /** Which service the results actually came from. */
  source: 'google' | 'overpass' | 'overpass-proxy' | 'nominatim';
}

function describe(tag: string, err: unknown): string {
  return `${tag}: ${err instanceof Error ? err.message : String(err)}`;
}

/**
 * Tries Google Places first when a key is configured (best data: real ratings,
 * broadest coverage) - silently skipped, not an error, when it isn't. Then
 * Overpass directly (best OSM coverage, supports all place types in one
 * query). If that fails - including when a visitor's ISP/network blocks those
 * specific domains outright - retries through our own same-origin proxy
 * (api/overpassProxy.ts), which reaches Overpass from Cloudflare's network
 * instead of the visitor's. If that also fails, falls back to a single
 * Nominatim search (separate OSM infrastructure). Only throws once every tier
 * has failed, with a reason from each, so callers can fall back to demo data
 * with an accurate error message.
 */
export async function fetchNearbyPlaces(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<PlacesResult> {
  const tierErrors: string[] = [];

  try {
    const restaurants = await fetchNearbyRestaurantsFromGoogle(center, radiusMeters, placeTypes);
    if (restaurants.length > 0) {
      return { restaurants, source: 'google' };
    }
    tierErrors.push('google: returned no results');
  } catch (googleError) {
    if (!(googleError instanceof GooglePlacesNotConfiguredError)) {
      tierErrors.push(describe('google', googleError));
    }
  }

  try {
    const restaurants = await fetchNearbyRestaurants(center, radiusMeters, placeTypes);
    return { restaurants, source: 'overpass' };
  } catch (overpassError) {
    tierErrors.push(describe('direct', overpassError));

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
