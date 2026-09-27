import type { Restaurant, RouletteConfig } from '../types';
import { formatDistance } from '../utils/geo';
import './ResultCard.css';

interface ResultCardProps {
  winner: Restaurant;
  config: RouletteConfig;
  onRespinExcluding: () => void;
  onRespinFresh: () => void;
}

function mapsUrl(r: Restaurant): string {
  const query = encodeURIComponent(r.name);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${r.lat},${r.lon}`;
}

export function ResultCard({ winner, config, onRespinExcluding, onRespinFresh }: ResultCardProps) {
  return (
    <div className="result-card">
      <p className="result-kicker">🎉 Tonight's pick</p>
      <h2 className="result-name">{winner.name}</h2>
      <p className="result-meta">
        {winner.cuisine ? `${winner.cuisine} · ` : ''}
        {formatDistance(winner.distanceMeters)} away
        {winner.isMock ? ' · demo data' : ''}
      </p>
      <p className="result-plan">
        For {config.groupSize} {config.groupSize === 1 ? 'person' : 'people'} · ~${config.budgetPerPerson}/person
      </p>
      <div className="result-actions">
        <a className="btn-primary" href={mapsUrl(winner)} target="_blank" rel="noreferrer">
          Open in Maps
        </a>
        <button className="btn-secondary" onClick={onRespinExcluding}>
          🔁 Respin (exclude this)
        </button>
        <button className="btn-secondary" onClick={onRespinFresh}>
          🔄 Spin again
        </button>
      </div>
    </div>
  );
}
