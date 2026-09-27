import type { LatLon, PlaceType, Restaurant } from '../types';
import { destinationPoint, haversineMeters } from './geo';

const MOCK_NAMES: Array<{ name: string; cuisine: string; type: PlaceType }> = [
  { name: 'Golden Wok', cuisine: 'chinese', type: 'restaurant' },
  { name: 'Sakura Sushi', cuisine: 'japanese', type: 'restaurant' },
  { name: "Mario's Pizzeria", cuisine: 'italian', type: 'restaurant' },
  { name: 'Taco Fiesta', cuisine: 'mexican', type: 'fast_food' },
  { name: 'The Green Bowl', cuisine: 'vegetarian', type: 'cafe' },
  { name: 'Spice Route', cuisine: 'indian', type: 'restaurant' },
  { name: 'Burger Barn', cuisine: 'burger', type: 'fast_food' },
  { name: 'Café Lumière', cuisine: 'french', type: 'cafe' },
  { name: 'The Hoppy Pint', cuisine: 'pub_food', type: 'pub' },
  { name: 'Seoul Kitchen', cuisine: 'korean', type: 'restaurant' },
  { name: 'Falafel House', cuisine: 'middle_eastern', type: 'fast_food' },
  { name: 'Noodle Bar', cuisine: 'asian', type: 'restaurant' },
  { name: 'The Deli Corner', cuisine: 'sandwich', type: 'cafe' },
  { name: "Nonna's Table", cuisine: 'italian', type: 'restaurant' },
  { name: 'Pho Real', cuisine: 'vietnamese', type: 'restaurant' },
  { name: 'The Food Yard', cuisine: 'international', type: 'food_court' },
];

/** Deterministic-ish pseudo-random points around the user, used when live data can't be fetched. */
export function generateMockRestaurants(center: LatLon, radiusMeters: number, count = 14): Restaurant[] {
  const pool = [...MOCK_NAMES];
  const chosen = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));

  return chosen.map((entry, i) => {
    const bearing = Math.random() * 360;
    const distance = Math.sqrt(Math.random()) * radiusMeters * 0.95 + 40;
    const point = destinationPoint(center, distance, bearing);
    return {
      id: `mock-${i}-${entry.name}`,
      name: entry.name,
      cuisine: entry.cuisine,
      amenity: entry.type,
      lat: point.lat,
      lon: point.lon,
      distanceMeters: haversineMeters(center, point),
      address: 'Demo address (no live data available)',
      isMock: true,
    };
  });
}
