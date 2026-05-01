// ─── Slotable Items: Ability Domain ───────────────────────────────────────────
import type { ItemRarityKey, UIDisplayMeta, StatModifiers } from './types';
import type { AbilitySlotKey } from './slot-types';

// ── Targeting System ─────────────────────────────────────────────────────────

export type AbilityTargetingMode = "Self" | "Entity" | "Point" | "Directional" | "Cone" | "Line";

export interface AbilityTargetingConfig {
  readonly mode: AbilityTargetingMode;
  readonly rangeStuds: number;
  readonly requiresLOS: boolean;
  readonly radiusStuds?: number;
  readonly coneAngle?: number;
  readonly lineWidth?: number;
}

// ── Ability Effects ──────────────────────────────────────────────────────────

export type AbilityEffectType = "Damage" | "Heal" | "Buff" | "Debuff" | "Summon" | "Teleport";

export interface AbilityEffect {
  readonly type: AbilityEffectType;
  readonly magnitude: number;
  readonly scaling?: StatModifiers;
  readonly durationSec?: number;
}

// ── Ability School ───────────────────────────────────────────────────────────

export type AbilitySchool = "Combat" | "Magic" | "Utility" | "Ultimate";

// ── Ability Catalog Entry ────────────────────────────────────────────────────

export interface AbilityCatalogEntry {
  readonly id: string;
  readonly abilityKey: string;
  readonly slotCategory: "Ability";
  readonly display: UIDisplayMeta;
  readonly rarity: ItemRarityKey;
  readonly basePower: number;
  readonly castTimeSec: number;
  readonly cooldownSec: number;
  readonly resourceCost: number;
  readonly targeting: AbilityTargetingConfig;
  readonly effects: readonly AbilityEffect[];
  readonly animationId?: string;
  readonly soundEffectId?: string;
  readonly vfxAssetId?: string;
  readonly powerScaling?: number;
  readonly maxCharges?: number;
  readonly chargeRechargeTime?: number;
  readonly isPassive?: boolean;
  readonly school?: AbilitySchool;
  readonly requiredLevel?: number;
  readonly tradeable?: boolean;
  readonly sellable?: boolean;
  readonly sellPrice?: number;
  readonly unlockRequirements?: {
    readonly level?: number;
    readonly questId?: string;
    readonly prerequisiteAbilityId?: string;
  };
}

// ── Ability Instance ─────────────────────────────────────────────────────────

export interface AbilityItemInstance {
  readonly guid: string;
  readonly catalogId: string;
  readonly slotCategory: "Ability";
  readonly quantity: 1;
  readonly abilityKey: string;
  readonly acquiredAt: number;
  readonly ownerUserId: number;
  abilityRank?: number;
  timesUsed?: number;
  isUnlocked: boolean;
  isNew?: boolean;
  customName?: string;
}

// ── Ability Loadouts ─────────────────────────────────────────────────────────

/** Loadout format: slot → ability key string */
export type AbilityLoadout = {
  readonly [Key in AbilitySlotKey]?: string;
};

/** Instance-based loadout: slot → full item instance */
export type AbilityInstanceLoadout = {
  [Key in AbilitySlotKey]?: AbilityItemInstance;
};

export const DEFAULT_ABILITY_LOADOUT: AbilityLoadout = {
  Ability1: undefined,
  Ability2: undefined,
  Ability3: undefined,
  Ability4: undefined,
  Ability5: undefined,
};

export const DEFAULT_ABILITY_INSTANCE_LOADOUT: AbilityInstanceLoadout = {
  Ability1: undefined,
  Ability2: undefined,
  Ability3: undefined,
  Ability4: undefined,
  Ability5: undefined,
};

// ── Factory ──────────────────────────────────────────────────────────────────

export function createAbilityInstance(
  catalogEntry: AbilityCatalogEntry,
  guid: string,
  ownerUserId: number,
): AbilityItemInstance {
  return {
    guid,
    catalogId: catalogEntry.id,
    slotCategory: "Ability",
    quantity: 1,
    abilityKey: catalogEntry.abilityKey,
    acquiredAt: os.time(),
    ownerUserId,
    isUnlocked: true,
    isNew: true,
  };
}
