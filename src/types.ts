export interface LatLon {
  lat: number;
  lon: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  amenity: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  address?: string;
  isMock?: boolean;
}

export const PLACE_TYPES = {
  restaurant: 'Restaurant',
  fast_food: 'Fast Food',
  cafe: 'Cafe',
  pub: 'Bar / Pub',
  food_court: 'Food Court',
} as const;

export type PlaceType = keyof typeof PLACE_TYPES;

export interface RouletteConfig {
  radiusMeters: number;
  budgetPerPerson: number;
  groupSize: number;
  placeTypes: Record<PlaceType, boolean>;
  maxWheelItems: number;
}

export const DEFAULT_CONFIG: RouletteConfig = {
  radiusMeters: 1000,
  budgetPerPerson: 10,
  groupSize: 4,
  placeTypes: {
    restaurant: true,
    fast_food: true,
    cafe: true,
    pub: true,
    food_court: true,
  },
  maxWheelItems: 16,
};
