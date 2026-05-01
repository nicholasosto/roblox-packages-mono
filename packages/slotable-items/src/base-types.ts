// ─── Slotable Items: Base Item Types, Mixins & Guards ─────────────────────────
import type { ItemRarityKey, UIDisplayMeta, StatModifiers } from './types';
import type { SlotCategoryKey, EquipmentSlotKey } from './slot-types';
import { EQUIPMENT_SLOT_KEYS } from './slot-types';
import type { PassiveEffectConfig } from './equipment-types';

// ── Rarity Sort Order ────────────────────────────────────────────────────────

export const RARITY_SORT_ORDER: Record<ItemRarityKey, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Mythic: 5,
};

// ── Capability Mixins ────────────────────────────────────────────────────────

/** Items that provide stat modifiers when equipped. */
export interface StatModifiable {
  readonly modifiers: StatModifiers;
}

/** Items that grant passive effects while equipped. */
export interface PassiveGranting {
  readonly passiveEffects: readonly PassiveEffectConfig[];
}

/** Items that grant abilities when equipped. */
export interface AbilityGranting {
  readonly grantedAbilities: readonly string[];
}

/** Items that can be stacked in inventory. */
export interface Stackable {
  readonly maxStackSize: number;
}

// ── Base Catalog Entry ───────────────────────────────────────────────────────

/** Base interface for ALL slotable item catalog entries (static game data). */
export interface BaseSlotableCatalogEntry {
  readonly id: string;
  readonly display: UIDisplayMeta;
  readonly rarity: ItemRarityKey;
  readonly slotCategory: SlotCategoryKey;
  readonly requiredLevel?: number;
  readonly tradeable?: boolean;
  readonly sellable?: boolean;
  readonly sellPrice?: number;
}

// ── Base Instance ────────────────────────────────────────────────────────────

/** Base interface for ALL slotable item instances (player-owned). */
export interface BaseSlotableInstance {
  readonly guid: string;
  readonly catalogId: string;
  readonly slotCategory: SlotCategoryKey;
  quantity: number;
  readonly acquiredAt: number;
  readonly ownerUserId: number;
  customName?: string;
  isLocked?: boolean;
  isNew?: boolean;
}

// ── Drag-Drop Types ──────────────────────────────────────────────────────────

export interface SlotDragPayload {
  readonly instance: BaseSlotableInstance;
  readonly sourceSlot?: string;
  readonly fromInventory: boolean;
  readonly catalogEntry: BaseSlotableCatalogEntry;
}

export interface SlotDropResult {
  readonly success: boolean;
  readonly reason?: SlotDropFailureReason;
  readonly displacedItem?: BaseSlotableInstance;
}

export type SlotDropFailureReason =
  | "IncompatibleSlot"
  | "LevelRequirementNotMet"
  | "SlotLocked"
  | "ItemLocked"
  | "InventoryFull"
  | "SameSlot";

// ── Slot Compatibility ───────────────────────────────────────────────────────

/** Check if an item can be placed in a target slot. */
export function canItemFitInSlot(
  itemCategory: SlotCategoryKey,
  itemEquipmentSlot: EquipmentSlotKey | undefined,
  targetSlotCategory: SlotCategoryKey,
  targetEquipmentSlot: EquipmentSlotKey | undefined,
): boolean {
  if (itemCategory !== targetSlotCategory) return false;
  if (itemCategory === "Equipment" && itemEquipmentSlot !== undefined) {
    return itemEquipmentSlot === targetEquipmentSlot;
  }
  return true;
}

/** Get the category of a slot type string. */
export function getSlotCategoryFromSlotType(slotType: string): SlotCategoryKey {
  if ((EQUIPMENT_SLOT_KEYS as readonly string[]).includes(slotType)) return "Equipment";
  if (string.sub(slotType, 1, 9) === "Accessory") return "Accessory";
  if (string.sub(slotType, 1, 7) === "SoulGem") return "SoulGem";
  if (string.sub(slotType, 1, 7) === "Ability") return "Ability";
  if (string.sub(slotType, 1, 10) === "Consumable") return "Consumable";
  return "Equipment";
}

// ── Type Guards ──────────────────────────────────────────────────────────────

export function hasStatModifiers(
  entry: BaseSlotableCatalogEntry,
): entry is BaseSlotableCatalogEntry & StatModifiable {
  return "modifiers" in entry && (entry as StatModifiable).modifiers !== undefined;
}

export function hasPassiveEffects(
  entry: BaseSlotableCatalogEntry,
): entry is BaseSlotableCatalogEntry & PassiveGranting {
  return "passiveEffects" in entry && (entry as PassiveGranting).passiveEffects !== undefined;
}

export function hasGrantedAbilities(
  entry: BaseSlotableCatalogEntry,
): entry is BaseSlotableCatalogEntry & AbilityGranting {
  return "grantedAbilities" in entry && (entry as AbilityGranting).grantedAbilities !== undefined;
}

export function isStackable(
  entry: BaseSlotableCatalogEntry,
): entry is BaseSlotableCatalogEntry & Stackable {
  return "maxStackSize" in entry && (entry as Stackable).maxStackSize > 1;
}
