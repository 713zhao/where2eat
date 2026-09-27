// Cloudflare Pages Function: proxies Google Places API (New) Nearby Search
// requests server-side, so the API key never reaches the browser.
//
// Requires a GOOGLE_PLACES_API_KEY environment variable (Pages project ->
// Settings -> Environment variables -> add as a Secret for Production).
// Without one, responds 501 so the client treats this tier as "not
// configured" and silently falls back to the OSM-based chain - the app works
// fully without this key, just with OSM's data instead of Google's.
//
// Deployed automatically by Cloudflare Pages' build (file-based routing:
// this file becomes POST /api/places). Not part of the Vite/tsc build for
// src/.

// Our PlaceType keys -> Google Places (New) "Table A" included types.
// https://developers.google.com/maps/documentation/places/web-service/place-types
const GOOGLE_TYPES: Record<string, string> = {
  restaurant: 'restaurant',
  fast_food: 'fast_food_restaurant',
  cafe: 'cafe',
  pub: 'bar',
  food_court: 'food_court',
};

const REQUEST_TIMEOUT_MS = 8000;

interface RequestBody {
  lat?: number;
  lon?: number;
  radiusMeters?: number;
  placeTypes?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequestPost = async (context: any): Promise<Response> => {
  const apiKey: string | undefined = context.env?.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: RequestBody;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { lat, lon, radiusMeters, placeTypes } = body;
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    typeof radiusMeters !== 'number' ||
    !Array.isArray(placeTypes)
  ) {
    return new Response(JSON.stringify({ error: 'Missing or invalid lat/lon/radiusMeters/placeTypes' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const includedTypes = [...new Set(placeTypes.map((t) => GOOGLE_TYPES[t]).filter(Boolean))];
  if (includedTypes.length === 0) {
    return new Response(JSON.stringify({ places: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.location,places.rating,places.formattedAddress,places.primaryType',
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: Math.min(radiusMeters, 50000),
          },
        },
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `status ${response.status}: ${text.slice(0, 300)}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof DOMException && err.name === 'AbortError' ? 'timed out' : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timeout);
  }
};
