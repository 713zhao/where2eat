import { useEffect, useRef, useState } from 'react';
import { GOOGLE_MAPS_MAP_ID, isGoogleMapsConfigured, loadGoogleMaps } from '../api/googleMapsLoader';
import type { LatLon, Restaurant } from '../types';
import { sliceColor } from '../utils/colors';
import { formatDistance } from '../utils/geo';
import { googleMapsUrl } from '../utils/mapsLink';
import './PlacesMap.css';

interface PlacesMapProps {
  center: LatLon;
  items: Restaurant[];
  winnerId?: string | null;
  /** True when `center` is the user's real location (vs. a saved/demo fallback). */
  isLiveLocation: boolean;
}

interface Libraries {
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Interactive Google Map showing your location plus every place on the wheel,
 * with numbered pins colored to match the wheel slices. The winner's pin is
 * enlarged and the map pans to it. Renders nothing when no Maps key is set.
 */
export function PlacesMap({ center, items, winnerId, isLiveLocation }: PlacesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [libs, setLibs] = useState<Libraries | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the API and create the map once.
  useEffect(() => {
    if (!isGoogleMapsConfigured) return;
    let cancelled = false;

    // Google calls this global when the key is rejected (bad key, referrer not allowed, billing off).
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      setError('Google Maps rejected the API key (check its HTTP referrer restrictions and that billing is enabled).');
    };

    loadGoogleMaps()
      .then(async () => {
        const [maps, marker] = await Promise.all([
          google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
          google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
        ]);
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lon },
          zoom: 15,
          mapId: GOOGLE_MAPS_MAP_ID,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
        });
        infoWindowRef.current = new maps.InfoWindow();
        setLibs({ maps, marker });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
    // Map is created once; center/items updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)draw markers whenever the places, center, or winner change.
  useEffect(() => {
    const map = mapRef.current;
    if (!libs || !map) return;
    const { AdvancedMarkerElement, PinElement } = libs.marker;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];
    infoWindowRef.current?.close();

    const bounds = new google.maps.LatLngBounds();
    const centerPos = { lat: center.lat, lng: center.lon };
    bounds.extend(centerPos);

    const youDot = document.createElement('div');
    youDot.className = isLiveLocation ? 'map-you-dot' : 'map-you-dot is-fallback';
    markersRef.current.push(
      new AdvancedMarkerElement({
        map,
        position: centerPos,
        content: youDot,
        title: isLiveLocation ? 'You are here' : 'Search center',
        zIndex: 1,
      }),
    );

    items.forEach((item, i) => {
      const isWinner = item.id === winnerId;
      const pin = new PinElement({
        background: sliceColor(i),
        borderColor: isWinner ? '#111827' : '#ffffff',
        glyphColor: '#ffffff',
        glyph: String(i + 1),
        scale: isWinner ? 1.5 : 1,
      });
      const position = { lat: item.lat, lng: item.lon };
      bounds.extend(position);

      const marker = new AdvancedMarkerElement({
        map,
        position,
        content: pin.element,
        title: `${i + 1}. ${item.name}`,
        zIndex: isWinner ? 1000 : 10 + i,
        gmpClickable: true,
      });
      marker.addListener('click', () => {
        const info = infoWindowRef.current;
        if (!info) return;
        info.setContent(
          `<div class="map-info">
             <strong>${escapeHtml(item.name)}</strong>
             <div>${item.rating != null ? `⭐ ${item.rating} · ` : ''}${formatDistance(item.distanceMeters)} away</div>
             ${item.address ? `<div class="map-info-addr">${escapeHtml(item.address)}</div>` : ''}
             <a href="${googleMapsUrl(item)}" target="_blank" rel="noreferrer">Open in Google Maps</a>
           </div>`,
        );
        info.open({ map, anchor: marker });
      });
      markersRef.current.push(marker);
    });

    const winner = items.find((r) => r.id === winnerId);
    if (winner) {
      map.panTo({ lat: winner.lat, lng: winner.lon });
      if ((map.getZoom() ?? 0) < 16) map.setZoom(16);
    } else if (items.length > 0) {
      map.fitBounds(bounds, 40);
    } else {
      map.setCenter(centerPos);
      map.setZoom(15);
    }
  }, [libs, items, winnerId, center.lat, center.lon, isLiveLocation]);

  if (!isGoogleMapsConfigured) return null;

  return (
    <section className="places-map-wrap" aria-label="Map of nearby places">
      <div ref={containerRef} className="places-map" />
      {error && <p className="places-map-error">🗺️ {error}</p>}
    </section>
  );
}
