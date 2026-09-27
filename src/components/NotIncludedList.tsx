import type { Restaurant } from '../types';
import './NotIncludedList.css';

interface NotIncludedListProps {
  items: Restaurant[];
  onInclude: (id: string) => void;
}

export function NotIncludedList({ items, onInclude }: NotIncludedListProps) {
  if (items.length === 0) return null;

  return (
    <details className="not-included">
      <summary>Not included in this spin ({items.length})</summary>
      <ul className="not-included-list">
        {items.map((item) => (
          <li key={item.id} className="not-included-item">
            <span className="not-included-name">{item.name}</span>
            <button
              type="button"
              className="not-included-btn"
              onClick={() => onInclude(item.id)}
              title="Add back to the wheel"
            >
              ↩️ Include
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
