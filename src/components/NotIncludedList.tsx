import { placeName, useT } from '../i18n';
import type { Restaurant } from '../types';
import './NotIncludedList.css';

interface NotIncludedListProps {
  items: Restaurant[];
  onInclude: (id: string) => void;
}

export function NotIncludedList({ items, onInclude }: NotIncludedListProps) {
  const t = useT();
  if (items.length === 0) return null;

  return (
    <details className="not-included">
      <summary>{t.notIncluded(items.length)}</summary>
      <ul className="not-included-list">
        {items.map((item) => (
          <li key={item.id} className="not-included-item">
            <span className="not-included-name">{placeName(item, t)}</span>
            <button
              type="button"
              className="not-included-btn"
              onClick={() => onInclude(item.id)}
              title={t.addBack}
            >
              ↩️ {t.include}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
