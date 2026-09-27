import { useState } from 'react';
import { PLACE_TYPES, type PlaceType, type RouletteConfig } from '../types';
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
        <h2>Spin Settings</h2>

        <label className="field">
          <span>
            Search radius: <strong>{draft.radiusMeters} m</strong>
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
            <span>Budget per person ($)</span>
            <input
              type="number"
              min={1}
              value={draft.budgetPerPerson}
              onChange={(e) => setDraft({ ...draft, budgetPerPerson: Number(e.target.value) })}
            />
          </label>

          <label className="field">
            <span>Group size</span>
            <input
              type="number"
              min={1}
              value={draft.groupSize}
              onChange={(e) => setDraft({ ...draft, groupSize: Number(e.target.value) })}
            />
          </label>
        </div>
        <p className="field-hint">
          Budget and group size are shown alongside your results as a reminder for the group — most map
          data doesn't reliably expose price levels, so this doesn't filter results yet (see suggestions).
        </p>

        <fieldset className="field">
          <span>Place types</span>
          <div className="chip-row">
            {Object.entries(PLACE_TYPES).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={draft.placeTypes[key as PlaceType] ? 'chip chip-active' : 'chip'}
                onClick={() => togglePlaceType(key as PlaceType)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>
            Max places on the wheel: <strong>{draft.maxWheelItems}</strong>
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
        <p className="field-hint">
          When there are more nearby places than this, only the closest ones make it onto the wheel.
        </p>

        {cuisineOptions.length > 0 && (
          <fieldset className="field">
            <span>Cuisine filter (optional)</span>
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
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
