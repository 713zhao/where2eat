import type { Restaurant } from '../types';
import { haversineMeters } from './geo';

// OSM often maps individual food court stalls as separate fast_food/restaurant nodes
// right next to the food court itself. Physically they're the same destination, so
// treat anything within this radius of a food_court as belonging to it rather than
// showing each stall as its own wheel entry.
const MERGE_RADIUS_METERS = 20;

/**
 * Collapses individual stalls into their containing food court (when one is present
 * in the results), so the wheel shows one entry per food court instead of one per
 * stall. Stalls with no nearby food_court are left as-is.
 */
export function mergeFoodCourtStalls(restaurants: Restaurant[]): Restaurant[] {
  const foodCourts = restaurants.filter((r) => r.amenity === 'food_court');
  if (foodCourts.length === 0) return restaurants;

  const stallCounts = new Map<string, number>();

  const kept = restaurants.filter((r) => {
    if (r.amenity === 'food_court') return true;
    const container = foodCourts.find((fc) => haversineMeters(fc, r) <= MERGE_RADIUS_METERS);
    if (!container) return true;
    stallCounts.set(container.id, (stallCounts.get(container.id) ?? 0) + 1);
    return false;
  });

  return kept.map((r) => {
    const stallCount = stallCounts.get(r.id);
    return stallCount ? { ...r, name: `${r.name} (${stallCount} stalls)` } : r;
  });
}
