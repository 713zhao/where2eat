import type { LatLon, PlaceType, Restaurant } from '../types';
import { haversineMeters } from '../utils/geo';

// Overpass is a shared community service with per-IP rate limits. Mobile carriers and
// iCloud Private Relay often put many people behind the same exit IP, which can trip
// those limits - so we try a couple of independent mirrors before giving up.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const REQUEST_TIMEOUT_MS = 10000;
const HEDGE_DELAY_MS = 2500;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function buildQuery(center: LatLon, radiusMeters: number, placeTypes: PlaceType[]): string {
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

  return {
    id: `${el.type}-${el.id}`,
    name,
    cuisine: tags.cuisine,
    amenity: tags.amenity ?? 'restaurant',
    lat,
    lon,
    distanceMeters: haversineMeters(center, { lat, lon }),
    address,
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

/**
 * Races all mirrors, but staggers them: later mirrors only start after a short
 * delay, so a healthy first mirror isn't doubled up on for no reason. Whichever
 * mirror answers successfully first wins; only rejects if all of them fail.
 */
function describeError(endpoint: string, err: unknown): string {
  const host = new URL(endpoint).hostname;
  const message = err instanceof DOMException && err.name === 'AbortError' ? 'timed out' : String(err);
  return `${host}: ${message}`;
}

function queryWithHedging(query: string): Promise<OverpassResponse> {
  return new Promise((resolve, reject) => {
    const errorMessages: string[] = new Array(OVERPASS_ENDPOINTS.length);
    let remaining = OVERPASS_ENDPOINTS.length;
    let settled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function attempt(index: number) {
      queryEndpoint(OVERPASS_ENDPOINTS[index], query).then(
        (data) => {
          if (!settled) {
            settled = true;
            timers.forEach(clearTimeout);
            resolve(data);
          }
        },
        (err) => {
          errorMessages[index] = describeError(OVERPASS_ENDPOINTS[index], err);
          remaining -= 1;
          if (remaining === 0 && !settled) {
            reject(new Error(errorMessages.filter(Boolean).join(' | ')));
          }
        },
      );
    }

    attempt(0);
    for (let i = 1; i < OVERPASS_ENDPOINTS.length; i++) {
      timers.push(setTimeout(() => attempt(i), HEDGE_DELAY_MS * i));
    }
  });
}

export async function fetchNearbyRestaurants(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<Restaurant[]> {
  if (placeTypes.length === 0) return [];

  const query = buildQuery(center, radiusMeters, placeTypes);
  const data = await queryWithHedging(query);

  const restaurants = data.elements
    .map((el) => elementToRestaurant(el, center))
    .filter((r): r is Restaurant => r !== null && r.distanceMeters <= radiusMeters);

  restaurants.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return restaurants;
}
