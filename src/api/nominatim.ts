import type { LatLon } from '../types';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_TIMEOUT_MS = 8000;

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

function formatAddress(data: NominatimResponse): string | null {
  const a = data.address;
  if (a) {
    const parts = [
      a.road ?? a.pedestrian ?? a.neighbourhood,
      a.suburb ?? a.city_district,
      a.city ?? a.town ?? a.village,
    ].filter((part): part is string => Boolean(part));
    if (parts.length > 0) return parts.join(', ');
  }
  return data.display_name ?? null;
}

/** Best-effort reverse geocode. Returns null on any failure rather than throwing. */
export async function reverseGeocode(center: LatLon): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${NOMINATIM_ENDPOINT}?format=jsonv2&lat=${center.lat}&lon=${center.lon}&zoom=16&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;

    const data: NominatimResponse = await response.json();
    return formatAddress(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
