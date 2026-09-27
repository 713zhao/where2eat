import type { LatLon, PlaceType, Restaurant } from '../types';
import { buildQuery, parseOverpassResponse, type OverpassResponse } from './overpass';

const PROXY_ENDPOINT = '/api/overpass';
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Fallback path for when the browser can't reach Overpass directly (e.g. an ISP or
 * carrier filters those specific domains). Calls our own same-origin Cloudflare Pages
 * Function, which forwards the query to Overpass server-side from Cloudflare's
 * network instead of the visitor's. Only exists on the Pages deployment - fails
 * harmlessly (404) anywhere else, like local dev or the Workers deployment, letting
 * the caller fall through to the next tier.
 */
export async function fetchNearbyRestaurantsViaProxy(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<Restaurant[]> {
  if (placeTypes.length === 0) return [];

  const query = buildQuery(center, radiusMeters, placeTypes);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass proxy failed with status ${response.status}`);
    }

    const data: OverpassResponse = await response.json();
    return parseOverpassResponse(data, center, radiusMeters);
  } finally {
    clearTimeout(timeout);
  }
}
