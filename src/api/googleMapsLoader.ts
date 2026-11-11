// Loads the Google Maps JavaScript API once, on demand, using the browser key
// from VITE_GOOGLE_MAPS_API_KEY (baked in at build time). This key is public by
// design - it ships to the browser - so it must be restricted by HTTP referrer
// in Google Cloud Console. It is deliberately separate from the server-side
// GOOGLE_PLACES_API_KEY, which must never reach the browser.

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? '';
export const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID';
const CALLBACK_NAME = '__where2eatMapsReady';

export const isGoogleMapsConfigured = API_KEY.length > 0;

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (!isGoogleMapsConfigured) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window.google?.maps?.importLibrary === 'function') {
      resolve();
      return;
    }

    const w = window as unknown as Record<string, unknown>;
    w[CALLBACK_NAME] = () => {
      delete w[CALLBACK_NAME];
      resolve();
    };

    const params = new URLSearchParams({
      key: API_KEY,
      v: 'weekly',
      loading: 'async',
      callback: CALLBACK_NAME,
    });
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      script.remove();
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
