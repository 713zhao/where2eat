import type { Restaurant } from '../types';
import { SLICE_COLORS } from '../utils/colors';
import { formatDistance } from '../utils/geo';
import './RestaurantLegend.css';


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
