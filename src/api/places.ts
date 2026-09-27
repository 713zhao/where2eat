import type { LatLon, PlaceType, Restaurant } from '../types';
import { searchNearbyPlaces } from './nominatimSearch';
import { fetchNearbyRestaurants } from './overpass';

export interface PlacesResult {
  restaurants: Restaurant[];
  /** Which service the results actually came from. */
  source: 'overpass' | 'nominatim';
}

/**
 * Tries Overpass first (best coverage, supports all place types in one query).
 * If every Overpass mirror is unreachable, falls back to a single Nominatim
 * search before giving up - Nominatim is a separate OSM service on different
 * infrastructure, so it can succeed even when Overpass specifically can't be
 * reached on a given network. Throws the original Overpass error only if both
 * fail, so callers can fall back to demo data with an accurate error message.
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
    const fallback = await searchNearbyPlaces(center, radiusMeters, placeTypes);
    if (fallback.length > 0) {
      return { restaurants: fallback, source: 'nominatim' };
    }
    throw overpassError;
  }
}
