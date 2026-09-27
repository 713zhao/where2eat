import type { LatLon, PlaceType, Restaurant } from '../types';
import { destinationPoint, haversineMeters } from '../utils/geo';

const NOMINATIM_SEARCH_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 8000;

// Preference order for the single search term we send - Nominatim's free-text search
// takes one query, not an OR-list of categories like Overpass does.
const SEARCH_PRIORITY: PlaceType[] = ['restaurant', 'cafe', 'fast_food', 'pub', 'food_court'];
const SEARCH_TERM: Record<PlaceType, string> = {
  restaurant: 'restaurant',
  fast_food: 'fast food',
  cafe: 'cafe',
  pub: 'bar',
  food_court: 'food court',
};

interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: { house_number?: string; road?: string };
  extratags?: { cuisine?: string; stars?: string };
}

function viewbox(center: LatLon, radiusMeters: number): string {
  const north = destinationPoint(center, radiusMeters, 0);
  const east = destinationPoint(center, radiusMeters, 90);
  const south = destinationPoint(center, radiusMeters, 180);
  const west = destinationPoint(center, radiusMeters, 270);
  return `${west.lon},${north.lat},${east.lon},${south.lat}`;
}

/**
 * Fallback POI search via Nominatim, used only when Overpass is entirely
 * unreachable. Nominatim's usage policy asks for light, non-bulk querying, so
 * this sends a single request for the highest-priority selected place type
 * rather than one call per type. Returns [] on any failure rather than
 * throwing, so callers can fall through to demo data.
 */
export async function searchNearbyPlaces(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<Restaurant[]> {
  const primaryType = SEARCH_PRIORITY.find((t) => placeTypes.includes(t));
  if (!primaryType) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      q: SEARCH_TERM[primaryType],
      viewbox: viewbox(center, radiusMeters),
      bounded: '1',
      limit: '25',
      addressdetails: '1',
      extratags: '1',
    });
    const response = await fetch(`${NOMINATIM_SEARCH_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];

    const results: NominatimSearchResult[] = await response.json();
    const restaurants = results
      .map((item): Restaurant | null => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
        const name = item.name || item.display_name.split(',')[0];
        if (!name) return null;
        const rating = item.extratags?.stars ? parseFloat(item.extratags.stars) : undefined;

        return {
          id: `nominatim-${item.place_id}`,
          name,
          cuisine: item.extratags?.cuisine,
          amenity: primaryType,
          lat,
          lon,
          distanceMeters: haversineMeters(center, { lat, lon }),
          address: [item.address?.house_number, item.address?.road].filter(Boolean).join(' ') || undefined,
          rating: rating != null && !Number.isNaN(rating) ? rating : undefined,
        };
      })
      .filter((r): r is Restaurant => r !== null && r.distanceMeters <= radiusMeters);

    restaurants.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return restaurants;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
