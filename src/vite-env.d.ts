/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Browser key for the Maps JavaScript API (referrer-restricted). Optional - the map is hidden without it. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Optional Map ID (required by Advanced Markers). Falls back to Google's DEMO_MAP_ID. */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
