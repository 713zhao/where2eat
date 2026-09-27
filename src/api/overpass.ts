import type { LatLon, PlaceType, Restaurant } from '../types';
import { haversineMeters } from '../utils/geo';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const REQUEST_TIMEOUT_MS = 15000;

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

export async function fetchNearbyRestaurants(
  center: LatLon,
  radiusMeters: number,
  placeTypes: PlaceType[],
): Promise<Restaurant[]> {
  if (placeTypes.length === 0) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const query = buildQuery(center, radiusMeters, placeTypes);
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    const data: OverpassResponse = await response.json();
    const restaurants = data.elements
      .map((el) => elementToRestaurant(el, center))
      .filter((r): r is Restaurant => r !== null && r.distanceMeters <= radiusMeters);

    restaurants.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return restaurants;
  } finally {
    clearTimeout(timeout);
  }
}
