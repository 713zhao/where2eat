import { useEffect, useMemo, useState } from 'react';
import { fetchNearbyRestaurants } from './api/overpass';
import { ConfigModal } from './components/ConfigModal';
import { ResultCard } from './components/ResultCard';
import { RestaurantLegend } from './components/RestaurantLegend';
import { RouletteWheel } from './components/RouletteWheel';
import { useConfig } from './hooks/useConfig';
import { useGeolocation } from './hooks/useGeolocation';
import type { LatLon, PlaceType, Restaurant } from './types';
import { generateMockRestaurants } from './utils/mockData';
import './App.css';

const MAX_WHEEL_ITEMS = 16;
// Times Square, NYC - used only if the browser can't provide a location, so the app stays usable.
const FALLBACK_CENTER: LatLon = { lat: 40.758, lon: -73.9855 };

function activeTypesFrom(config: ReturnType<typeof useConfig>['config']): PlaceType[] {
  return Object.entries(config.placeTypes)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type as PlaceType);
}

function App() {
  const { config, updateConfig } = useConfig();
  const { position, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [usingMockData, setUsingMockData] = useState(false);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const activeTypes = useMemo(() => activeTypesFrom(config), [config]);
  const activeTypesKey = activeTypes.join(',');

  const effectivePosition: LatLon | null = position ?? (!geoLoading && geoError ? FALLBACK_CENTER : null);

  useEffect(() => {
    if (!effectivePosition) return;
    let cancelled = false;

    setFetchStatus('loading');
    setUsingFallbackLocation(!position);

    fetchNearbyRestaurants(effectivePosition, config.radiusMeters, activeTypes)
      .then((list) => {
        if (cancelled) return;
        if (list.length === 0) throw new Error('No live results in range');
        setRestaurants(list);
        setUsingMockData(false);
        setFetchStatus('success');
        setExcludedIds(new Set());
        setSelectedCuisines(new Set());
        setWinner(null);
      })
      .catch(() => {
        if (cancelled) return;
        setRestaurants(generateMockRestaurants(effectivePosition, config.radiusMeters));
        setUsingMockData(true);
        setFetchStatus('success');
        setExcludedIds(new Set());
        setSelectedCuisines(new Set());
        setWinner(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePosition?.lat, effectivePosition?.lon, config.radiusMeters, activeTypesKey, refreshToken]);

  const cuisineOptions = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.cuisine && set.add(r.cuisine));
    return Array.from(set).sort();
  }, [restaurants]);

  const pool = useMemo(() => {
    let list = restaurants.filter((r) => !excludedIds.has(r.id));
    if (selectedCuisines.size > 0) {
      list = list.filter((r) => r.cuisine && selectedCuisines.has(r.cuisine));
    }
    return list.slice(0, MAX_WHEEL_ITEMS);
  }, [restaurants, excludedIds, selectedCuisines]);

  function handleRespinExcluding() {
    if (winner) setExcludedIds((prev) => new Set(prev).add(winner.id));
    setWinner(null);
  }

  function handleRespinFresh() {
    setWinner(null);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>🎡 where2eat</h1>
        <button className="icon-button" onClick={() => setShowConfig(true)} aria-label="Settings">
          ⚙️
        </button>
      </header>

      <p className="tagline">
        Spin to pick where your group eats — within {config.radiusMeters}m, for {config.groupSize} people,
        ~${config.budgetPerPerson}/person.{' '}
        <button className="link-button" onClick={() => setRefreshToken((t) => t + 1)}>
          Refresh list
        </button>
      </p>

      {geoLoading && <p className="banner">📍 Finding your location…</p>}
      {!geoLoading && geoError && (
        <p className="banner banner-warn">
          ⚠️ {geoError} Showing a demo location instead.{' '}
          <button className="link-button" onClick={requestLocation}>
            Try again
          </button>
        </p>
      )}
      {usingFallbackLocation && !geoLoading && !geoError && (
        <p className="banner banner-warn">⚠️ Using a demo location since yours isn't available.</p>
      )}
      {fetchStatus === 'loading' && <p className="banner">🍽️ Finding nearby places…</p>}
      {usingMockData && fetchStatus === 'success' && (
        <p className="banner banner-warn">
          ⚠️ Live map data unavailable right now — showing demo restaurants so you can still try the spin.
        </p>
      )}

      <main className="content">
        <RouletteWheel
          items={pool}
          spinning={spinning}
          onSpinStart={() => {
            setSpinning(true);
            setWinner(null);
          }}
          onSpinEnd={(w) => {
            setSpinning(false);
            setWinner(w);
          }}
        />
        <RestaurantLegend items={pool} winnerId={winner?.id} />
      </main>

      {winner && (
        <ResultCard
          winner={winner}
          config={config}
          onRespinExcluding={handleRespinExcluding}
          onRespinFresh={handleRespinFresh}
        />
      )}

      {showConfig && (
        <ConfigModal
          config={config}
          cuisineOptions={cuisineOptions}
          selectedCuisines={selectedCuisines}
          onCuisinesChange={setSelectedCuisines}
          onSave={updateConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}

export default App;
