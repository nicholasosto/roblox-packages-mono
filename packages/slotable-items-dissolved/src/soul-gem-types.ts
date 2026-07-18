// ─── Slotable Items: Soul Gem Domain ──────────────────────────────────────────
import type { StatModifiers } from './types';
import type { SoulGemSlotKey } from './slot-types';
import type { BaseSlotableCatalogEntry, BaseSlotableInstance, StatModifiable, AbilityGranting } from './base-types';

// ── Acquisition Sources ──────────────────────────────────────────────────────

export type SoulGemAcquisitionSource = "BossDrop" | "QuestReward" | "SecretLocation" | "Crafting";

// ── Effect Types ─────────────────────────────────────────────────────────────

export type SoulGemEffectType =
  | "RegenerativeShield"
  | "LifeSteal"
  | "DamageReflect"
  | "StatBoost"
  | "CriticalEnhance"
  | "MovementBoost"
  | "ResourceRegen"
  | "DamageReduction"
  | "ElementalAffinity"
  | "OnHitProc";

// ── Per-Effect Config Interfaces ─────────────────────────────────────────────

export interface RegenerativeShieldConfig {
  readonly type: "RegenerativeShield";
  readonly maxShield: number;
  readonly cooldownSeconds: number;
  readonly regenPerSecond: number;
}

export interface LifeStealConfig {
  readonly type: "LifeSteal";
  readonly stealPercent: number;
}

export interface DamageReflectConfig {
  readonly type: "DamageReflect";
  readonly reflectPercent: number;
}

export interface MovementBoostConfig {
  readonly type: "MovementBoost";
  readonly speedBoostPercent: number;
}

export interface ResourceRegenConfig {
  readonly type: "ResourceRegen";
  readonly regenMultiplier: number;
}

export interface CriticalEnhanceConfig {
  readonly type: "CriticalEnhance";
  readonly critChanceBonus: number;
  readonly critDamageBonus: number;
}

export interface DamageReductionConfig {
  readonly type: "DamageReduction";
  readonly flatReduction: number;
  readonly percentReduction: number;
}

export interface OnHitProcConfig {
  readonly type: "OnHitProc";
  readonly magnitude: number;
  readonly procChance: number;
  readonly cooldownSec?: number;
}

export type SoulGemPassiveConfig =
  | RegenerativeShieldConfig
  | LifeStealConfig
  | DamageReflectConfig
  | MovementBoostConfig
  | ResourceRegenConfig
  | CriticalEnhanceConfig
  | DamageReductionConfig
  | OnHitProcConfig;

// ── Soul Gem Catalog Entry ───────────────────────────────────────────────────

export interface SoulGemCatalogEntry
  extends BaseSlotableCatalogEntry,
    StatModifiable,
    Partial<AbilityGranting>
{
  readonly slotCategory: "SoulGem";
  readonly acquisitionSource: SoulGemAcquisitionSource;
  readonly acquisitionDetail: string;
  readonly dropChance?: number;
  /**
   * Rich, per-effect passive configs. v1.0 collapses the pre-v1 **dual representation**
   * (a singular `passiveEffect: SoulGemPassiveConfig` + a separate loose inline
   * `passiveEffects` array) down to this one plural, strongly-typed field. Stat numbers
   * live on `modifiers` (from StatModifiable); these configs carry the richer per-effect
   * behavior (shield amounts, lifesteal %, etc.) the game's combat layer applies.
   */
  readonly passiveEffects?: readonly SoulGemPassiveConfig[];
  readonly loreText?: string;
  readonly equippedVfxId?: string;
}

// ── Soul Gem Instance ────────────────────────────────────────────────────────

export interface SoulGemItemInstance extends BaseSlotableInstance {
  readonly slotCategory: "SoulGem";
  readonly quantity: 1;
  gemExperience?: number;
  gemLevel?: number;
}

// ── Soul Gem Loadout ─────────────────────────────────────────────────────────

export type SoulGemLoadout = {
  [Key in SoulGemSlotKey]?: SoulGemItemInstance;
};

export const DEFAULT_SOUL_GEM_LOADOUT: SoulGemLoadout = {
  SoulGem1: undefined,
  SoulGem2: undefined,
  SoulGem3: undefined,
};

// ── Active Effects (Runtime State) ───────────────────────────────────────────

export interface RegenerativeShieldState {
  readonly gemGuid: string;
  readonly catalogId: string;
  currentShield: number;
  maxShield: number;
  isOnCooldown: boolean;
  cooldownEndTime?: number;
}

export interface SoulGemActiveEffects {
  shields: RegenerativeShieldState[];
  statBonuses: Map<string, number>;
  lifeStealPercent: number;
  damageReflectPercent: number;
  speedBoostPercent: number;
  regenMultiplier: number;
  critChanceBonus: number;
  critDamageBonus: number;
  flatDamageReduction: number;
  percentDamageReduction: number;
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createSoulGemInstance(
  catalogEntry: SoulGemCatalogEntry,
  guid: string,
  ownerUserId: number,
): SoulGemItemInstance {
  return {
    guid,
    catalogId: catalogEntry.id,
    slotCategory: "SoulGem",
    quantity: 1,
    acquiredAt: os.time(),
    ownerUserId,
    gemExperience: 0,
    gemLevel: 1,
    isNew: true,
  };
}

/**
 * Get unlocked soul gem slots for a given player level.
 * Threshold config is passed in (not hardcoded) for game-agnosticism.
 */
export function getUnlockedSoulGemSlots(
  playerLevel: number,
  thresholds: Record<SoulGemSlotKey, number>,
): SoulGemSlotKey[] {
  const slots: SoulGemSlotKey[] = [];
  for (const slot of ["SoulGem1", "SoulGem2", "SoulGem3"] as const) {
    if (playerLevel >= thresholds[slot]) {
      slots.push(slot);
    }
  }
  return slots;
}
