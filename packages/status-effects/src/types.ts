// ─── Status Effects: Core Types ───────────────────────────────────────────────

// ── Effect Types (aligned with slotable-items PassiveEffectType by convention) ─

export type EffectType =
  | "RegenerativeShield"
  | "LifeSteal"
  | "DamageReflect"
  | "MovementBoost"
  | "ResourceRegen"
  | "CriticalEnhance"
  | "DamageReduction"
  | "ElementalAffinity"
  | "OnHitProc"
  | "AuraEffect";

// ── Stacking Rules ───────────────────────────────────────────────────────────

export type StackingRule = "additive" | "multiplicative" | "diminishing" | "highest";

// ── Effect Source ────────────────────────────────────────────────────────────

/** Tracks where an effect originates from. */
export interface EffectSource {
  /** GUID of the item or buff providing this effect */
  readonly sourceId: string;
  /** Source category (e.g., "Equipment", "SoulGem", "Consumable", "Buff") */
  readonly sourceType: string;
  /** Optional catalog reference for the source item */
  readonly catalogId?: string;
}

// ── Passive Effect Input ─────────────────────────────────────────────────────

/** A single passive effect from any source. */
export interface PassiveEffect {
  readonly type: EffectType;
  readonly magnitude: number;
  readonly source: EffectSource;
  readonly cooldownSec?: number;
  readonly procChance?: number;
  readonly durationSec?: number;
  readonly radiusStuds?: number;
}

// ── Shield State (runtime, mutable) ──────────────────────────────────────────

/** Runtime state of one regenerative shield. */
export interface ShieldState {
  readonly sourceId: string;
  currentShield: number;
  readonly maxShield: number;
  readonly cooldownSeconds: number;
  readonly regenPerSecond: number;
  isOnCooldown: boolean;
  cooldownEndTime?: number;
}

// ── Aggregated Active Effects ────────────────────────────────────────────────

/** Combined runtime state from all active effects. */
export interface ActiveEffects {
  shields: ShieldState[];
  /** Aggregated stat bonuses — string keys for game-agnosticism */
  statBonuses: Map<string, number>;
  lifeStealPercent: number;
  damageReflectPercent: number;
  speedBoostPercent: number;
  /** Multiplicative stacking — starts at 1 */
  regenMultiplier: number;
  critChanceBonus: number;
  critDamageBonus: number;
  flatDamageReduction: number;
  /** Diminishing returns stacking */
  percentDamageReduction: number;
}

// ── Buff Instance ────────────────────────────────────────────────────────────

/**
 * A temporary effect with duration.
 * Timing uses os.clock() (monotonic, not wall-clock).
 */
export interface BuffInstance {
  readonly id: string;
  readonly buffId: string;
  readonly source: EffectSource;
  readonly effects: readonly PassiveEffect[];
  readonly statModifiers?: Partial<Record<string, number>>;
  readonly durationSec: number;
  /** os.clock() timestamp when this buff was applied */
  readonly startTime: number;
  readonly stackCount: number;
  readonly maxStacks: number;
  readonly refreshOnReuse: boolean;
}

// ── Buff Config (input for applyBuff) ────────────────────────────────────────

export interface BuffConfig {
  readonly durationSec: number;
  readonly stackable?: boolean;
  readonly maxStacks?: number;
  readonly refreshOnReuse?: boolean;
  readonly statModifiers?: Partial<Record<string, number>>;
}
