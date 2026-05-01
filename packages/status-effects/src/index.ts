// ─── @trembus/status-effects: Barrel Exports ─────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────
export {
  type EffectType,
  type StackingRule,
  type EffectSource,
  type PassiveEffect,
  type ShieldState,
  type ActiveEffects,
  type BuffInstance,
  type BuffConfig,
} from './types';

// ── Stacking Rules ───────────────────────────────────────────────────────────
export {
  stackAdditive,
  stackMultiplicative,
  stackDiminishing,
  stackHighest,
} from './stacking';

// ── Damage Calculations ──────────────────────────────────────────────────────
export {
  calculateLifeStealHealing,
  calculateReflectedDamage,
  applyDamageReduction,
} from './damage-calc';

// ── Shield System ────────────────────────────────────────────────────────────
export {
  processShieldDamage,
  updateShieldRegeneration,
} from './shield';

// ── Effect Aggregation ───────────────────────────────────────────────────────
export {
  createDefaultActiveEffects,
  aggregateEffects,
  mergeActiveEffects,
} from './aggregator';

// ── Buff Tracking ────────────────────────────────────────────────────────────
export {
  applyBuff,
  removeExpiredBuffs,
  removeBuffById,
  getBuffRemainingTime,
  getAggregatedBuffEffects,
} from './buff-tracker';
