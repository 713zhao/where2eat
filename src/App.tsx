import { useEffect, useMemo, useState } from 'react';
import { reverseGeocode } from './api/nominatim';
import { fetchNearbyPlaces } from './api/places';
import { ConfigModal } from './components/ConfigModal';
import { PlacesMap } from './components/PlacesMap';
import { NotIncludedList } from './components/NotIncludedList';
import { ResultCard } from './components/ResultCard';
import { RestaurantLegend } from './components/RestaurantLegend';
import { RouletteWheel } from './components/RouletteWheel';
import { useBlacklist } from './hooks/useBlacklist';
import { useConfig } from './hooks/useConfig';
import { useGeolocation } from './hooks/useGeolocation';
import { useLastLocation } from './hooks/useLastLocation';
import { I18nProvider, LANGUAGE_TAGS, TRANSLATIONS } from './i18n';
import type { LatLon, PlaceType, Restaurant } from './types';
import { mergeFoodCourtStalls } from './utils/foodCourtMerge';
import { generateMockRestaurants } from './utils/mockData';
import './App.css';

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
  const { lastLocation, saveLastLocation } = useLastLocation();
  const { blacklist, toggleBlacklist } = useBlacklist();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'empty'>('idle');
  const [usingMockData, setUsingMockData] = useState(false);
  const [usingBackupSource, setUsingBackupSource] = useState(false);
  const [usingProxySource, setUsingProxySource] = useState(false);
  const [fetchErrorDetail, setFetchErrorDetail] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const t = TRANSLATIONS[config.language];

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_TAGS[config.language];
  }, [config.language]);

  const activeTypes = useMemo(() => activeTypesFrom(config), [config]);
  const activeTypesKey = activeTypes.join(',');

  const savedFallback: LatLon | null = lastLocation ? { lat: lastLocation.lat, lon: lastLocation.lon } : null;
  const effectivePosition: LatLon | null =
    position ?? (!geoLoading && geoError ? (savedFallback ?? FALLBACK_CENTER) : null);
  const usingSavedFallback = !position && !geoLoading && !!geoError && !!savedFallback;
  const usingDemoFallback = !position && !geoLoading && !!geoError && !savedFallback;

  useEffect(() => {
    if (!position) return;
    let cancelled = false;

    reverseGeocode(position, config.language).then((address) => {
      if (cancelled) return;
      setCurrentAddress(address);
      saveLastLocation({ lat: position.lat, lon: position.lon, address, savedAt: Date.now() });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.lat, position?.lon, config.language]);

  useEffect(() => {
    if (!effectivePosition) return;
    let cancelled = false;

    setFetchStatus('loading');

    fetchNearbyPlaces(effectivePosition, config.radiusMeters, activeTypes, config.language)
      .then(({ restaurants: list, source }) => {
        if (cancelled) return;
        setRestaurants(mergeFoodCourtStalls(list));
        setUsingMockData(false);
        setUsingBackupSource(source === 'nominatim');
        setUsingProxySource(source === 'overpass-proxy');
        setFetchErrorDetail(null);
        setFetchStatus(list.length === 0 ? 'empty' : 'success');
        setExcludedIds(new Set());
        setSelectedCuisines(new Set());
        setWinner(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setRestaurants(mergeFoodCourtStalls(generateMockRestaurants(effectivePosition, config.radiusMeters)));
        setUsingMockData(true);
        setUsingBackupSource(false);
        setUsingProxySource(false);
        setFetchErrorDetail(err instanceof Error ? err.message : String(err));
        setFetchStatus('success');
        setExcludedIds(new Set());
        setSelectedCuisines(new Set());
        setWinner(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePosition?.lat, effectivePosition?.lon, config.radiusMeters, activeTypesKey, refreshToken, config.language]);

  const cuisineOptions = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.cuisine && set.add(r.cuisine));
    return Array.from(set).sort();
  }, [restaurants]);

  const pool = useMemo(() => {
    let list = restaurants.filter((r) => !excludedIds.has(r.id) && !blacklist.has(r.id));
    if (selectedCuisines.size > 0) {
      list = list.filter((r) => r.cuisine && selectedCuisines.has(r.cuisine));
    }
    const sorted = [...list].sort((a, b) => {
      if (config.sortMode === 'rating') {
        const ratingDiff = (b.rating ?? -1) - (a.rating ?? -1);
        if (ratingDiff !== 0) return ratingDiff;
      }
      return a.distanceMeters - b.distanceMeters;
    });
    return sorted.slice(0, config.maxWheelItems);
  }, [restaurants, excludedIds, selectedCuisines, config.maxWheelItems, config.sortMode, blacklist]);

  const notIncluded = useMemo(
    () => restaurants.filter((r) => blacklist.has(r.id)),
    [restaurants, blacklist],
  );

  function handleRespinExcluding() {
    if (winner) setExcludedIds((prev) => new Set(prev).add(winner.id));
    setWinner(null);
  }

  function handleRespinFresh() {
    setWinner(null);
  }

  return (
    <I18nProvider value={t}>
    <div className="app-shell">
      <header className="app-header">
        <h1>🎡 where2eat</h1>
        <button className="icon-button" onClick={() => setShowConfig(true)} aria-label={t.settings}>
          ⚙️
        </button>
      </header>

      <p className="tagline">
        {t.tagline(config.radiusMeters, config.groupSize, config.budgetPerPerson)}{' '}
        <button className="link-button" onClick={() => setRefreshToken((t) => t + 1)}>
          {t.refreshList}
        </button>
      </p>

      {position && currentAddress && <p className="address-line">📍 {currentAddress}</p>}
      {usingSavedFallback && lastLocation?.address && (
        <p className="address-line">📍 {t.lastKnown} {lastLocation.address}</p>
      )}

      {geoLoading && <p className="banner">📍 {t.findingLocation}</p>}
      {!geoLoading && geoError && (
        <p className="banner banner-warn">
          ⚠️ {t.geo[geoError]}{' '}
          <button className="link-button" onClick={requestLocation}>
            {t.tryAgain}
          </button>
        </p>
      )}
      {usingSavedFallback && (
        <p className="banner banner-warn">⚠️ {t.usingSavedLocation}</p>
      )}
      {usingDemoFallback && (
        <p className="banner banner-warn">⚠️ {t.usingDemoLocation}</p>
      )}
      {fetchStatus === 'loading' && <p className="banner">🍽️ {t.findingPlaces}</p>}
      {usingProxySource && fetchStatus === 'success' && (
        <p className="banner">ℹ️ {t.viaProxy}</p>
      )}
      {usingBackupSource && fetchStatus === 'success' && (
        <p className="banner banner-warn">
          ℹ️ {t.viaBackup}
        </p>
      )}
      {usingMockData && fetchStatus === 'success' && (
        <p className="banner banner-warn">
          ⚠️ {t.usingMock}
          {fetchErrorDetail && <span className="banner-detail">{fetchErrorDetail}</span>}
        </p>
      )}
      {fetchStatus === 'empty' && (
        <p className="banner banner-warn">
          😕 {t.noneFound(config.radiusMeters)}{' '}
          <button className="link-button" onClick={() => setShowConfig(true)}>
            {t.tryBiggerRadius}
          </button>
          .
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
        <RestaurantLegend items={pool} winnerId={winner?.id} onExclude={toggleBlacklist} />
      </main>

      {effectivePosition && (
        <PlacesMap
          center={effectivePosition}
          items={pool}
          winnerId={winner?.id}
          isLiveLocation={!!position}
          language={config.language}
        />
      )}

      <NotIncludedList items={notIncluded} onInclude={toggleBlacklist} />

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
    </I18nProvider>
  );
}

export default App;
