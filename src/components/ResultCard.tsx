import { placeName, useT } from '../i18n';
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
  const t = useT();
  return (
    <div className="result-card">
      <p className="result-kicker">{t.winnerKicker}</p>
      <h2 className="result-name">{placeName(winner, t)}</h2>
      <p className="result-meta">
        {winner.cuisine ? `${winner.cuisine} · ` : ''}
        {t.away(formatDistance(winner.distanceMeters))}
        {winner.isMock ? ` · ${t.demoData}` : ''}
      </p>
      <p className="result-plan">
        {t.forGroup(config.groupSize, config.budgetPerPerson)}
      </p>
      <div className="result-actions">
        <a className="btn-primary" href={googleMapsUrl(winner)} target="_blank" rel="noreferrer">
          {t.openInGoogleMaps}
        </a>
        <button className="btn-secondary" onClick={onRespinExcluding}>
          {t.respinExcluding}
        </button>
        <button className="btn-secondary" onClick={onRespinFresh}>
          {t.spinAgain}
        </button>
      </div>
    </div>
  );
}
