// ─── Status Effects: Damage Calculations ──────────────────────────────────────

/**
 * Calculate healing from life steal.
 * @returns Healing amount (integer, rounded down)
 */
export function calculateLifeStealHealing(damageDealt: number, lifeStealPercent: number): number {
  return math.floor(damageDealt * lifeStealPercent);
}

/**
 * Calculate reflected damage.
 * @returns Damage reflected back to attacker (integer, rounded down)
 */
export function calculateReflectedDamage(incomingDamage: number, reflectPercent: number): number {
  return math.floor(incomingDamage * reflectPercent);
}

/**
 * Apply two-stage damage reduction: flat first, then percent.
 * Flat reduction is subtracted first (floored at 0), then percent reduces the remainder.
 * @returns Final damage after reduction (integer, rounded down, minimum 0)
 */
export function applyDamageReduction(
  incomingDamage: number,
  flatReduction: number,
  percentReduction: number,
): number {
  const afterFlat = math.max(0, incomingDamage - flatReduction);
  return math.max(0, math.floor(afterFlat * (1 - percentReduction)));
}
