// ─── Status Effects: Buff/Debuff Tracker ──────────────────────────────────────
import type { BuffInstance, BuffConfig, EffectSource, PassiveEffect } from './types';

/**
 * Apply a buff to the active buff list.
 * Handles stacking (increment stack count), refresh (reset startTime),
 * or reject (max stacks reached).
 * @returns Updated buff array (new reference)
 */
export function applyBuff(
  activeBuffs: BuffInstance[],
  buffId: string,
  source: EffectSource,
  effects: readonly PassiveEffect[],
  config: BuffConfig,
): BuffInstance[] {
  const existing = activeBuffs.filter((b) => b.buffId === buffId);
  const others = activeBuffs.filter((b) => b.buffId !== buffId);

  const maxStacks = config.maxStacks ?? 1;
  const stackable = config.stackable ?? false;
  const refreshOnReuse = config.refreshOnReuse ?? false;

  if (existing.size() > 0 && refreshOnReuse) {
    // Refresh: reset startTime on all existing stacks
    const refreshed = existing.map((b) => ({
      ...b,
      startTime: os.clock(),
    }));
    return [...others, ...refreshed];
  }

  if (existing.size() > 0 && stackable && existing.size() < maxStacks) {
    // Stack: add a new stack
    const newStack: BuffInstance = {
      id: `${buffId}_${existing.size() + 1}`,
      buffId,
      source,
      effects,
      statModifiers: config.statModifiers,
      durationSec: config.durationSec,
      startTime: os.clock(),
      stackCount: existing.size() + 1,
      maxStacks,
      refreshOnReuse,
    };
    return [...activeBuffs, newStack];
  }

  if (existing.size() > 0) {
    // Max stacks reached or not stackable — no change
    return activeBuffs;
  }

  // New buff
  const newBuff: BuffInstance = {
    id: `${buffId}_1`,
    buffId,
    source,
    effects,
    statModifiers: config.statModifiers,
    durationSec: config.durationSec,
    startTime: os.clock(),
    stackCount: 1,
    maxStacks,
    refreshOnReuse,
  };
  return [...activeBuffs, newBuff];
}

/**
 * Remove expired buffs based on current time.
 * Uses os.clock() — monotonic, not wall-clock.
 * @returns Object with remaining active buffs and expired buffs (for cleanup/notifications)
 */
export function removeExpiredBuffs(
  activeBuffs: BuffInstance[],
  currentTime: number,
): { remaining: BuffInstance[]; expired: BuffInstance[] } {
  const remaining: BuffInstance[] = [];
  const expired: BuffInstance[] = [];

  for (const buff of activeBuffs) {
    if (currentTime >= buff.startTime + buff.durationSec) {
      expired.push(buff);
    } else {
      remaining.push(buff);
    }
  }

  return { remaining, expired };
}

/**
 * Remove all stacks of a buff by its definition ID.
 * @returns Updated buff array without the specified buff
 */
export function removeBuffById(
  activeBuffs: BuffInstance[],
  buffId: string,
): BuffInstance[] {
  return activeBuffs.filter((b) => b.buffId !== buffId);
}

/**
 * Get remaining time on a buff in seconds.
 * @returns Seconds remaining (0 if expired)
 */
export function getBuffRemainingTime(buff: BuffInstance, currentTime: number): number {
  const endTime = buff.startTime + buff.durationSec;
  return math.max(0, endTime - currentTime);
}

/**
 * Collect all passive effects and stat modifiers from active buffs.
 * Feed the result into aggregateEffects() for full effect calculation.
 */
export function getAggregatedBuffEffects(activeBuffs: BuffInstance[]): {
  effects: PassiveEffect[];
  statModifiers: Partial<Record<string, number>>;
} {
  const effects: PassiveEffect[] = [];
  const statModifiers: Partial<Record<string, number>> = {};

  for (const buff of activeBuffs) {
    for (const effect of buff.effects) {
      effects.push(effect);
    }

    if (buff.statModifiers) {
      for (const [key, val] of pairs(buff.statModifiers)) {
        const existing = statModifiers[key] ?? 0;
        statModifiers[key] = existing + (val as number);
      }
    }
  }

  return { effects, statModifiers };
}
