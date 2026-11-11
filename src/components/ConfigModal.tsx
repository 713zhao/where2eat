import { useState } from 'react';
import { LANGUAGE_LABELS, TRANSLATIONS } from '../i18n';
import { PLACE_TYPES, type Language, type PlaceType, type RouletteConfig, type SortMode } from '../types';
import './ConfigModal.css';

interface ConfigModalProps {
  config: RouletteConfig;
  cuisineOptions: string[];
  selectedCuisines: Set<string>;
  onCuisinesChange: (next: Set<string>) => void;
  onSave: (config: RouletteConfig) => void;
  onClose: () => void;
}

export function ConfigModal({
  config,
  cuisineOptions,
  selectedCuisines,
  onCuisinesChange,
  onSave,
  onClose,
}: ConfigModalProps) {
  const [draft, setDraft] = useState<RouletteConfig>(config);
  // Follow the language being picked, so the switch previews immediately.
  const t = TRANSLATIONS[draft.language];

  function togglePlaceType(type: PlaceType) {
    setDraft((prev) => ({
      ...prev,
      placeTypes: { ...prev.placeTypes, [type]: !prev.placeTypes[type] },
    }));
  }

  function toggleCuisine(cuisine: string) {
    const next = new Set(selectedCuisines);
    if (next.has(cuisine)) next.delete(cuisine);
    else next.add(cuisine);
    onCuisinesChange(next);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{t.settingsTitle}</h2>

        <fieldset className="field">
          <span>{t.language}</span>
          <div className="chip-row">
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                lang={lang === 'zh' ? 'zh-CN' : 'en'}
                className={draft.language === lang ? 'chip chip-active' : 'chip'}
                onClick={() => setDraft({ ...draft, language: lang })}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>
            {t.searchRadius} <strong>{draft.radiusMeters} m</strong>
          </span>
          <input
            type="range"
            min={200}
            max={3000}
            step={100}
            value={draft.radiusMeters}
            onChange={(e) => setDraft({ ...draft, radiusMeters: Number(e.target.value) })}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>{t.budgetPerPerson}</span>
            <input
              type="number"
              min={1}
              value={draft.budgetPerPerson}
              onChange={(e) => setDraft({ ...draft, budgetPerPerson: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>{t.groupSize}</span>
            <input
              type="number"
              min={1}
              value={draft.groupSize}
              onChange={(e) => setDraft({ ...draft, groupSize: Number(e.target.value) })}
            />
          </label>
        </div>
        <p className="field-hint">{t.budgetHint}</p>

        <fieldset className="field">
          <span>{t.placeTypes}</span>
          <div className="chip-row">
            {(Object.keys(PLACE_TYPES) as PlaceType[]).map((key) => (
              <button
                key={key}
                type="button"
                className={draft.placeTypes[key] ? 'chip chip-active' : 'chip'}
                onClick={() => togglePlaceType(key)}
              >
                {t.placeTypeLabels[key]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>
            {t.maxOnWheel} <strong>{draft.maxWheelItems}</strong>
          </span>
          <input
            type="range"
            min={4}
            max={30}
            step={1}
            value={draft.maxWheelItems}
            onChange={(e) => setDraft({ ...draft, maxWheelItems: Number(e.target.value) })}
          />
        </label>

        <fieldset className="field">
          <span>{t.wheelPicks}</span>
          <div className="chip-row">
            {(['nearest', 'rating'] as SortMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={draft.sortMode === mode ? 'chip chip-active' : 'chip'}
                onClick={() => setDraft({ ...draft, sortMode: mode })}
              >
                {t.sortModes[mode]}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="field-hint">
          {t.wheelPicksHint}
          {draft.sortMode === 'rating' && t.ratingHint}
        </p>

        {cuisineOptions.length > 0 && (
          <fieldset className="field">
            <span>{t.cuisineFilter}</span>
            <div className="chip-row">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  className={selectedCuisines.has(cuisine) ? 'chip chip-active' : 'chip'}
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
