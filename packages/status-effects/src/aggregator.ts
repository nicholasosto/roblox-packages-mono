// ─── Status Effects: Effect Aggregator ────────────────────────────────────────
import type { PassiveEffect, ActiveEffects, ShieldState } from './types';
import { stackAdditive, stackMultiplicative, stackDiminishing } from './stacking';

/** Creates a zeroed ActiveEffects state ready for aggregation. */
export function createDefaultActiveEffects(): ActiveEffects {
  return {
    shields: [],
    statBonuses: new Map<string, number>(),
    lifeStealPercent: 0,
    damageReflectPercent: 0,
    speedBoostPercent: 0,
    regenMultiplier: 1,
    critChanceBonus: 0,
    critDamageBonus: 0,
    flatDamageReduction: 0,
    percentDamageReduction: 0,
  };
}

/**
 * Aggregate an array of passive effects from any source into a single ActiveEffects state.
 *
 * Stacking rules:
 * - Most bonuses: additive
 * - Regen multiplier: multiplicative (starts at 1)
 * - Percent damage reduction: diminishing returns
 */
export function aggregateEffects(effects: readonly PassiveEffect[]): ActiveEffects {
  const active = createDefaultActiveEffects();

  for (const effect of effects) {
    switch (effect.type) {
      case "RegenerativeShield": {
        const shield: ShieldState = {
          sourceId: effect.source.sourceId,
          currentShield: effect.magnitude,
          maxShield: effect.magnitude,
          cooldownSeconds: effect.cooldownSec ?? 30,
          regenPerSecond: effect.durationSec ?? 10, // reuse durationSec as regenRate for generic effects
          isOnCooldown: false,
        };
        active.shields.push(shield);
        break;
      }
      case "LifeSteal":
        active.lifeStealPercent = stackAdditive(active.lifeStealPercent, effect.magnitude);
        break;
      case "DamageReflect":
        active.damageReflectPercent = stackAdditive(active.damageReflectPercent, effect.magnitude);
        break;
      case "MovementBoost":
        active.speedBoostPercent = stackAdditive(active.speedBoostPercent, effect.magnitude);
        break;
      case "ResourceRegen":
        active.regenMultiplier = stackMultiplicative(active.regenMultiplier, 1 + effect.magnitude);
        break;
      case "CriticalEnhance":
        active.critChanceBonus = stackAdditive(active.critChanceBonus, effect.magnitude);
        // procChance doubles as crit damage bonus for this effect type
        if (effect.procChance !== undefined) {
          active.critDamageBonus = stackAdditive(active.critDamageBonus, effect.procChance);
        }
        break;
      case "DamageReduction":
        // magnitude = flat reduction, procChance = percent reduction
        active.flatDamageReduction = stackAdditive(active.flatDamageReduction, effect.magnitude);
        if (effect.procChance !== undefined) {
          active.percentDamageReduction = stackDiminishing(active.percentDamageReduction, effect.procChance);
        }
        break;
      // ElementalAffinity, OnHitProc, AuraEffect — game-specific, consumers handle these
      default:
        break;
    }
  }

  return active;
}

/**
 * Merge two ActiveEffects states together.
 * Useful for combining effects from different systems (e.g., equipment + buffs).
 */
export function mergeActiveEffects(a: ActiveEffects, b: ActiveEffects): ActiveEffects {
  const merged = createDefaultActiveEffects();

  // Shields: concatenate
  for (const s of a.shields) merged.shields.push(s);
  for (const s of b.shields) merged.shields.push(s);

  // Stat bonuses: additive merge
  for (const [key, val] of a.statBonuses) {
    merged.statBonuses.set(key, val);
  }
  for (const [key, val] of b.statBonuses) {
    const existing = merged.statBonuses.get(key) ?? 0;
    merged.statBonuses.set(key, existing + val);
  }

  // Additive fields
  merged.lifeStealPercent = a.lifeStealPercent + b.lifeStealPercent;
  merged.damageReflectPercent = a.damageReflectPercent + b.damageReflectPercent;
  merged.speedBoostPercent = a.speedBoostPercent + b.speedBoostPercent;
  merged.critChanceBonus = a.critChanceBonus + b.critChanceBonus;
  merged.critDamageBonus = a.critDamageBonus + b.critDamageBonus;
  merged.flatDamageReduction = a.flatDamageReduction + b.flatDamageReduction;

  // Multiplicative
  merged.regenMultiplier = a.regenMultiplier * b.regenMultiplier;

  // Diminishing returns
  merged.percentDamageReduction = stackDiminishing(a.percentDamageReduction, b.percentDamageReduction);

  return merged;
}
