import type { Restaurant, RouletteConfig } from '../types';
import { formatDistance } from '../utils/geo';
import { googleMapsUrl } from '../utils/mapsLink';
import './ResultCard.css';

interface ResultCardProps {
  winner: Restaurant;
  config: RouletteConfig;
  onRespinExcluding: () => void;
  onRespinFresh: () => void;
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
        <a className="btn-primary" href={googleMapsUrl(winner)} target="_blank" rel="noreferrer">
          Open in Google Maps
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
