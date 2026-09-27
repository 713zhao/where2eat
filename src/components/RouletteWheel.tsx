import { useMemo, useRef, useState } from 'react';
import type { Restaurant } from '../types';
import './RouletteWheel.css';

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

interface RouletteWheelProps {
  items: Restaurant[];
  spinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (winner: Restaurant) => void;
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function RouletteWheel({ items, spinning, onSpinStart, onSpinEnd }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const pendingWinner = useRef<Restaurant | null>(null);

  const sliceAngle = items.length > 0 ? 360 / items.length : 0;

  const background = useMemo(() => {
    if (items.length === 0) return '#e5e7eb';
    const stops = items.map((_, i) => {
      const color = SLICE_COLORS[i % SLICE_COLORS.length];
      return `${color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [items, sliceAngle]);

  const labels = useMemo(() => {
    return items.map((item, i) => {
      const midAngleDeg = i * sliceAngle + sliceAngle / 2;
      const rad = (midAngleDeg * Math.PI) / 180;
      const radiusPercent = 36;
      const x = 50 + radiusPercent * Math.sin(rad);
      const y = 50 - radiusPercent * Math.cos(rad);
      return { id: item.id, x, y, index: i + 1 };
    });
  }, [items, sliceAngle]);

  function handleSpinClick() {
    if (spinning || items.length === 0) return;

    const winnerIndex = Math.floor(Math.random() * items.length);
    pendingWinner.current = items[winnerIndex];

    const targetMidAngle = winnerIndex * sliceAngle + sliceAngle / 2;
    const currentMod = normalizeDeg(rotation);
    const desiredMod = normalizeDeg(360 - targetMidAngle);
    let delta = desiredMod - currentMod;
    if (delta <= 0) delta += 360;

    const extraFullSpins = 4 + Math.floor(Math.random() * 3);
    const nextRotation = rotation + delta + 360 * extraFullSpins;

    onSpinStart();
    setRotation(nextRotation);
  }

  function handleTransitionEnd() {
    if (pendingWinner.current) {
      onSpinEnd(pendingWinner.current);
      pendingWinner.current = null;
    }
  }

  return (
    <div className="wheel-container">
      <div className="wheel-pointer" aria-hidden="true" />
      <div
        className="wheel"
        style={{ background, transform: `rotate(${rotation}deg)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {labels.map((label) => (
          <span
            key={label.id}
            className="wheel-label"
            style={{ left: `${label.x}%`, top: `${label.y}%` }}
          >
            {label.index}
          </span>
        ))}
      </div>
      <button
        className="spin-button"
        onClick={handleSpinClick}
        disabled={spinning || items.length === 0}
      >
        {spinning ? 'Spinning…' : 'SPIN'}
      </button>
    </div>
  );
}
