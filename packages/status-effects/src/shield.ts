// ─── Status Effects: Shield System ────────────────────────────────────────────
import type { ShieldState } from './types';

/**
 * Process incoming damage against an array of shields.
 * Shields absorb damage sequentially. When a shield is fully depleted,
 * it enters cooldown. Returns remaining damage and updated shield states.
 */
export function processShieldDamage(
  shields: ShieldState[],
  incomingDamage: number,
): { remainingDamage: number; updatedShields: ShieldState[] } {
  let remaining = incomingDamage;
  const updatedShields: ShieldState[] = [];

  for (const shield of shields) {
    if (remaining <= 0 || shield.isOnCooldown || shield.currentShield <= 0) {
      updatedShields.push({ ...shield });
      continue;
    }

    const absorbed = math.min(remaining, shield.currentShield);
    remaining -= absorbed;

    const newShield: ShieldState = {
      ...shield,
      currentShield: shield.currentShield - absorbed,
    };

    // Shield fully depleted — enter cooldown
    if (newShield.currentShield <= 0) {
      newShield.currentShield = 0;
      newShield.isOnCooldown = true;
      newShield.cooldownEndTime = os.clock() + shield.cooldownSeconds;
    }

    updatedShields.push(newShield);
  }

  return { remainingDamage: remaining, updatedShields };
}

/**
 * Update shield regeneration over time. Called each tick with delta time.
 * - If on cooldown and cooldown expired: reset shield to max, clear cooldown
 * - If not on cooldown and shield < max: regenerate by regenPerSecond * deltaTime
 */
export function updateShieldRegeneration(
  shields: ShieldState[],
  deltaTime: number,
): ShieldState[] {
  const currentTime = os.clock();
  const updatedShields: ShieldState[] = [];

  for (const shield of shields) {
    const updated: ShieldState = { ...shield };

    if (updated.isOnCooldown) {
      // Check if cooldown has expired
      if (updated.cooldownEndTime !== undefined && currentTime >= updated.cooldownEndTime) {
        updated.currentShield = updated.maxShield;
        updated.isOnCooldown = false;
        updated.cooldownEndTime = undefined;
      }
    } else if (updated.currentShield < updated.maxShield) {
      // Regenerate shield
      updated.currentShield = math.min(
        updated.maxShield,
        updated.currentShield + updated.regenPerSecond * deltaTime,
      );
    }

    updatedShields.push(updated);
  }

  return updatedShields;
}
