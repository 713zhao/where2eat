import type { LatLon, PlaceType, Restaurant } from '../types';
import { haversineMeters } from '../utils/geo';

// Overpass mirrors are all community-run and occasionally unreachable from specific
// networks (rate limits, or a mirror being filtered/blocked outright) - query both in
// parallel and use whichever answers. See api/places.ts for the further fallback to
// Nominatim search when neither mirror is reachable at all.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];
const REQUEST_TIMEOUT_MS = 8000;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

export function buildQuery(center: LatLon, radiusMeters: number, placeTypes: PlaceType[]): string {
  const amenityRegex = placeTypes.join('|');
  const around = `(around:${radiusMeters},${center.lat},${center.lon})`;
  return `[out:json][timeout:20];(node["amenity"~"${amenityRegex}"]${around};way["amenity"~"${amenityRegex}"]${around};);out center tags;`;
}

function elementToRestaurant(el: OverpassElement, center: LatLon): Restaurant | null {
  const tags = el.tags ?? {};
  const name = tags.name;
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const address = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || tags['addr:full'];
  const rating = tags.stars ? parseFloat(tags.stars) : undefined;

  return {
    id: `${el.type}-${el.id}`,
    name,
    cuisine: tags.cuisine,
    amenity: tags.amenity ?? 'restaurant',
    lat,
    lon,
    distanceMeters: haversineMeters(center, { lat, lon }),
    address,
    rating: rating != null && !Number.isNaN(rating) ? rating : undefined,
  };
}

async function queryEndpoint(endpoint: string, query: string): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function describeError(endpoint: string, err: unknown): string {
  const host = new URL(endpoint).hostname;
  const message = err instanceof DOMException && err.name === 'AbortError' ? 'timed out' : String(err);
  return `${host}: ${message}`;
}

/** Races all mirrors in parallel; whichever answers first wins, rejects only if all fail. */
function queryAllMirrors(query: string): Promise<OverpassResponse> {
  return new Promise((resolve, reject) => {
    const errorMessages: string[] = new Array(OVERPASS_ENDPOINTS.length);
    let remaining = OVERPASS_ENDPOINTS.length;
    let settled = false;

    OVERPASS_ENDPOINTS.forEach((endpoint, index) => {
      queryEndpoint(endpoint, query).then(
        (data) => {
          if (!settled) {
            settled = true;
            resolve(data);
          }
        },
        (err) => {
          errorMessages[index] = describeError(endpoint, err);
          remaining -= 1;
          if (remaining === 0 && !settled) {
            reject(new Error(errorMessages.filter(Boolean).join(' | ')));
          }
        },
      );
    });
  });
}

/** Shared with the proxy fallback in api/overpassProxy.ts, which fetches the same shape of data. */
export function parseOverpassResponse(data: OverpassResponse, center: LatLon, radiusMeters: number): Restaurant[] {
  const restaurants = data.elements
    .map((el) => elementToRestaurant(el, center))
    .filter((r): r is Restaurant => r !== null && r.distanceMeters <= radiusMeters);

  restaurants.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return restaurants;
}

export async function fetchNearbyRestaurants(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<Restaurant[]> {
  if (placeTypes.length === 0) return [];

  const query = buildQuery(center, radiusMeters, placeTypes);
  const data = await queryAllMirrors(query);
  return parseOverpassResponse(data, center, radiusMeters);
}
