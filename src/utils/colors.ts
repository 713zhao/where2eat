/** Shared slice colors so the wheel, the legend, and the map pins all match. */
export const SLICE_COLORS = [
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

export function sliceColor(index: number): string {
  return SLICE_COLORS[index % SLICE_COLORS.length];
}
