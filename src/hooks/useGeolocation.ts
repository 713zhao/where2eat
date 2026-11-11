import { useCallback, useEffect, useState } from 'react';
import type { LatLon } from '../types';

export type GeoErrorCode = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

interface GeolocationState {
  position: LatLon | null;
  error: GeoErrorCode | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ position: null, error: null, loading: true });

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ position: null, error: 'unsupported', loading: false });
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
        const error: GeoErrorCode =
          err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable';
        setState({ position: null, error, loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...state, requestLocation };
}
