// ─── Status Effects: Stacking Rule Utilities ──────────────────────────────────

/** Additive stacking — values sum directly. */
export function stackAdditive(current: number, add: number): number {
  return current + add;
}

/** Multiplicative stacking — values multiply (e.g., regen: 1.2 * 1.3 = 1.56). */
export function stackMultiplicative(current: number, multiplier: number): number {
  return current * multiplier;
}

/**
 * Diminishing returns stacking — each addition has less impact.
 * Formula: 1 - (1 - current) * (1 - add)
 * Example: 20% + 30% = 1 - (0.8 * 0.7) = 44%, not 50%
 */
export function stackDiminishing(current: number, add: number): number {
  return 1 - (1 - current) * (1 - add);
}

/** Highest-wins stacking — only the largest value applies. */
export function stackHighest(current: number, candidate: number): number {
  return math.max(current, candidate);
}
