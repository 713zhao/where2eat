import type { LatLon, PlaceType, Restaurant } from '../types';
import { destinationPoint, haversineMeters } from './geo';

const MOCK_NAMES: Array<{ name: string; cuisine: string; type: PlaceType; rating?: number }> = [
  { name: 'Golden Wok', cuisine: 'chinese', type: 'restaurant' },
  { name: 'Sakura Sushi', cuisine: 'japanese', type: 'restaurant', rating: 5 },
  { name: "Mario's Pizzeria", cuisine: 'italian', type: 'restaurant' },
  { name: 'Taco Fiesta', cuisine: 'mexican', type: 'fast_food' },
  { name: 'The Green Bowl', cuisine: 'vegetarian', type: 'cafe', rating: 4 },
  { name: 'Spice Route', cuisine: 'indian', type: 'restaurant' },
  { name: 'Burger Barn', cuisine: 'burger', type: 'fast_food' },
  { name: 'Café Lumière', cuisine: 'french', type: 'cafe', rating: 4 },
  { name: 'The Hoppy Pint', cuisine: 'pub_food', type: 'pub' },
  { name: 'Seoul Kitchen', cuisine: 'korean', type: 'restaurant' },
  { name: 'Falafel House', cuisine: 'middle_eastern', type: 'fast_food' },
  { name: 'Noodle Bar', cuisine: 'asian', type: 'restaurant', rating: 3 },
  { name: 'The Deli Corner', cuisine: 'sandwich', type: 'cafe' },
  { name: "Nonna's Table", cuisine: 'italian', type: 'restaurant', rating: 5 },
  { name: 'Pho Real', cuisine: 'vietnamese', type: 'restaurant' },
  { name: 'The Food Yard', cuisine: 'international', type: 'food_court' },
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/** Deterministic-ish pseudo-random points around the user, used when live data can't be fetched. */
export function generateMockRestaurants(center: LatLon, radiusMeters: number, count = 14): Restaurant[] {
  const pool = [...MOCK_NAMES];
  const chosen = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));

  const restaurants = chosen.map((entry) => {
    const bearing = Math.random() * 360;
    const distance = Math.sqrt(Math.random()) * radiusMeters * 0.95 + 40;
    const point = destinationPoint(center, distance, bearing);
    return {
      // Name-based (not index-based) so a blacklist entry stays stable across re-shuffles.
      id: `mock-${slug(entry.name)}`,
      name: entry.name,
      cuisine: entry.cuisine,
      amenity: entry.type,
      lat: point.lat,
      lon: point.lon,
      distanceMeters: haversineMeters(center, point),
      address: 'Demo address (no live data available)',
      isMock: true,
      rating: entry.rating,
    };
  });

  restaurants.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return restaurants;
}
