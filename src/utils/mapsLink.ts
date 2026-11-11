import type { Restaurant } from '../types';

/**
 * Google Maps link for a place. Uses the real Google place ID when the place
 * came from Google Places, so the link opens that exact listing; otherwise
 * searches by name near the place's coordinates.
 */
export function googleMapsUrl(r: Restaurant): string {
  if (r.googlePlaceId) {
    const query = encodeURIComponent(r.name);
    return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(r.googlePlaceId)}`;
  }
  const query = encodeURIComponent(`${r.name} ${r.lat},${r.lon}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
