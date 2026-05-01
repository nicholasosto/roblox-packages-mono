// ─── Slotable Items: Equipment Domain ─────────────────────────────────────────
import type { ItemRarityKey, UIDisplayMeta, StatModifiers } from './types';
import type { EquipmentSlotKey } from './slot-types';

// ── Equipment Classification ─────────────────────────────────────────────────

export type WeaponType = "Sword" | "Axe" | "Mace" | "Staff" | "Bow" | "Dagger" | "Shield" | "Wand";
export type ArmorType = "Cloth" | "Leather" | "Mail" | "Plate";

// ── Passive Effect System ────────────────────────────────────────────────────

export type PassiveEffectType =
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

export interface PassiveEffectConfig {
  readonly type: PassiveEffectType;
  readonly magnitude: number;
  readonly cooldownSec?: number;
  readonly procChance?: number;
  readonly durationSec?: number;
  readonly radiusStuds?: number;
}

// ── Set Bonus System ─────────────────────────────────────────────────────────

export interface SetBonusTier {
  readonly piecesRequired: number;
  readonly modifiers?: StatModifiers;
  readonly passiveEffects?: readonly PassiveEffectConfig[];
  readonly grantedAbilities?: readonly string[];
  readonly description: string;
}

export interface EquipmentSetDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly memberItemIds: readonly string[];
  readonly bonusTiers: readonly SetBonusTier[];
}

// ── Equipment Catalog Entry ──────────────────────────────────────────────────

export interface EquipmentCatalogEntry {
  readonly id: string;
  readonly display: UIDisplayMeta;
  readonly rarity: ItemRarityKey;
  readonly slotCategory: "Equipment";
  readonly equipmentSlot: EquipmentSlotKey;
  readonly modifiers: StatModifiers;
  readonly setId?: string;
  readonly modelAssetId?: string;
  readonly accessoryKey?: string;
  readonly attachmentPoint?: string;
  readonly weaponType?: WeaponType;
  readonly armorType?: ArmorType;
  readonly passiveEffects?: readonly PassiveEffectConfig[];
  readonly grantedAbilities?: readonly string[];
  readonly requiredLevel?: number;
  readonly tradeable?: boolean;
  readonly sellable?: boolean;
  readonly sellPrice?: number;
}

// ── Equipment Instance ───────────────────────────────────────────────────────

export interface EquipmentItemInstance {
  readonly guid: string;
  readonly catalogId: string;
  readonly slotCategory: "Equipment";
  readonly quantity: 1;
  readonly equipmentSlot: EquipmentSlotKey;
  readonly acquiredAt: number;
  readonly ownerUserId: number;
  durability?: number;
  maxDurability?: number;
  enhancementLevel?: number;
  sockets?: readonly string[];
  isNew?: boolean;
  customName?: string;
  isLocked?: boolean;
}

// ── Equipment Loadout ────────────────────────────────────────────────────────

export type EquipmentLoadout = {
  [Key in EquipmentSlotKey]?: EquipmentItemInstance;
};

export const DEFAULT_EQUIPMENT_LOADOUT: EquipmentLoadout = {
  Head: undefined,
  Chest: undefined,
  Legs: undefined,
  Feet: undefined,
  Hands: undefined,
  MainHand: undefined,
  OffHand: undefined,
};

// ── Factory Functions ────────────────────────────────────────────────────────

export function createEquipmentInstance(
  catalogEntry: EquipmentCatalogEntry,
  guid: string,
  ownerUserId: number,
): EquipmentItemInstance {
  return {
    guid,
    catalogId: catalogEntry.id,
    slotCategory: "Equipment",
    quantity: 1,
    equipmentSlot: catalogEntry.equipmentSlot,
    acquiredAt: os.time(),
    ownerUserId,
    isNew: true,
  };
}

export function migrateEquipmentInstance(
  legacy: Partial<EquipmentItemInstance> & { guid: string; catalogId: string },
  fallbackEquipmentSlot?: EquipmentSlotKey,
): EquipmentItemInstance {
  return {
    guid: legacy.guid,
    catalogId: legacy.catalogId,
    slotCategory: "Equipment",
    quantity: 1,
    equipmentSlot: legacy.equipmentSlot ?? fallbackEquipmentSlot ?? "MainHand",
    acquiredAt: legacy.acquiredAt ?? os.time(),
    ownerUserId: legacy.ownerUserId ?? 0,
    durability: legacy.durability,
    maxDurability: legacy.maxDurability,
    enhancementLevel: legacy.enhancementLevel,
    sockets: legacy.sockets,
    isNew: legacy.isNew,
    customName: legacy.customName,
    isLocked: legacy.isLocked,
  };
}
