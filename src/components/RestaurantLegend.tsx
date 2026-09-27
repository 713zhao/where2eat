import type { Restaurant } from '../types';
import { formatDistance } from '../utils/geo';
import './RestaurantLegend.css';

const SLICE_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
];

interface RestaurantLegendProps {
  items: Restaurant[];
  winnerId?: string | null;
  onExclude: (id: string) => void;
}

export function RestaurantLegend({ items, winnerId, onExclude }: RestaurantLegendProps) {
  if (items.length === 0) {
    return <p className="legend-empty">No places found in range yet.</p>;
  }

  return (
    <ul className="legend-list">
      {items.map((item, i) => (
        <li key={item.id} className={item.id === winnerId ? 'legend-item is-winner' : 'legend-item'}>
          <span className="legend-dot" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}>
            {i + 1}
          </span>
          <span className="legend-name">{item.name}</span>
          {item.rating != null && <span className="legend-rating">⭐ {item.rating}</span>}
          <span className="legend-distance">{formatDistance(item.distanceMeters)}</span>
          <button
            type="button"
            className="legend-exclude-btn"
            onClick={() => onExclude(item.id)}
            aria-label={`Remove ${item.name} from the wheel`}
            title="Remove from wheel"
          >
            🚫
          </button>
        </li>
      ))}
    </ul>
  );
}
