import { useCallback, useEffect, useState } from 'react';
import type { LatLon } from '../types';

interface GeolocationState {
  position: LatLon | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ position: null, error: null, loading: true });

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ position: null, error: 'Geolocation is not supported by this browser.', loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({ position: null, error: err.message || 'Unable to get your location.', loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...state, requestLocation };
}
