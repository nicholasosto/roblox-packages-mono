// ─── Slotable Items: Unified Inventory (OPEN — registry-driven) ───────────────
//
// The loadout is now a dynamic map keyed by category → slot, so any registered
// category (built-in OR game-defined "Tower"/"Pet"/…) is a first-class citizen.
// Queries iterate the registry/map instead of five hardcoded named buckets.
// Built-in static typing is recovered via the typed accessors at the bottom.

import type { SlotCategoryKey, EquipmentSlotKey, AccessorySlotKey, SoulGemSlotKey, AbilitySlotKey, ConsumableSlotKey } from './slot-types';
import type {
  BaseSlotableCatalogEntry,
  BaseSlotableInstance,
  SlotDragPayload,
  SlotDropResult,
} from './base-types';
import { canItemFitInSlot, getSlotCategoryFromSlotType } from './base-types';
import { listSlotCategories } from './slot-category-registry';
import type { EquipmentItemInstance } from './equipment-types';
import type { AccessoryItemInstance } from './accessory-types';
import type { ConsumableItemInstance } from './consumable-types';
import type { AbilityItemInstance } from './ability-types';
import type { SoulGemItemInstance } from './soul-gem-types';

// ── Union Types ──────────────────────────────────────────────────────────────

/** Convenience union of the five BUILT-IN instance types. The canonical, open item
 *  type is `BaseSlotableInstance` (what the loadout map and backpack hold). */
export type AnySlotableInstance =
  | EquipmentItemInstance
  | AccessoryItemInstance
  | SoulGemItemInstance
  | AbilityItemInstance
  | ConsumableItemInstance;

export type AnySlotableCatalogEntry = BaseSlotableCatalogEntry;

// ── Open Loadout ──────────────────────────────────────────────────────────────

/** One category's slots: slot key → instance (undefined when empty). */
export type CategoryLoadout = { [slotKey: string]: BaseSlotableInstance | undefined };

/** The unified loadout: category key → that category's slots. OPEN — holds any
 *  registered category, replacing the five hardcoded named buckets. */
export type UnifiedLoadout = { [categoryKey: string]: CategoryLoadout };

/**
 * Build an empty loadout covering every CURRENTLY-registered category. Call at runtime
 * (after a game has registered its categories at boot) for a complete fresh loadout.
 * Buckets for late-registered categories are also created lazily on first equip by
 * consumer code, so a profile loaded before registration self-heals.
 */
export function createEmptyLoadout(): UnifiedLoadout {
  const loadout: UnifiedLoadout = {};
  for (const desc of listSlotCategories()) {
    const bucket: CategoryLoadout = {};
    for (const slotKey of desc.slotKeys) bucket[slotKey] = undefined;
    loadout[desc.key] = bucket;
  }
  return loadout;
}

/** Empty loadout for the categories registered at module load (the five built-ins).
 *  Prefer `createEmptyLoadout()` at runtime if a game registers categories at boot. */
export const DEFAULT_UNIFIED_LOADOUT: UnifiedLoadout = createEmptyLoadout();

// ── Unified Inventory Snapshot ───────────────────────────────────────────────

export interface UnifiedInventorySnapshot {
  readonly loadout: UnifiedLoadout;
  readonly backpack: readonly BaseSlotableInstance[];
  readonly learnedAbilities: readonly AbilityItemInstance[];
  readonly backpackCapacity: number;
}

export const DEFAULT_UNIFIED_INVENTORY: UnifiedInventorySnapshot = {
  loadout: DEFAULT_UNIFIED_LOADOUT,
  backpack: [],
  learnedAbilities: [],
  backpackCapacity: 100,
};

// ── Query Utilities (registry/map-driven) ─────────────────────────────────────

export function findItemByGuid(
  inventory: UnifiedInventorySnapshot,
  guid: string,
): { item: BaseSlotableInstance; location: "loadout" | "backpack" | "abilities"; slot?: string } | undefined {
  for (const item of inventory.backpack) {
    if (item.guid === guid) return { item, location: "backpack" };
  }
  for (const ability of inventory.learnedAbilities) {
    if (ability.guid === guid) return { item: ability, location: "abilities" };
  }
  for (const [, bucket] of pairs(inventory.loadout)) {
    for (const [slot, item] of pairs(bucket)) {
      if (item !== undefined && item.guid === guid) return { item, location: "loadout", slot: slot as string };
    }
  }
  return undefined;
}

export function getItemsByCategory(
  inventory: UnifiedInventorySnapshot,
  category: SlotCategoryKey,
): BaseSlotableInstance[] {
  const results: BaseSlotableInstance[] = [];

  for (const item of inventory.backpack) {
    if (item.slotCategory === category) results.push(item);
  }

  const bucket = inventory.loadout[category];
  if (bucket !== undefined) {
    for (const [, item] of pairs(bucket)) {
      if (item !== undefined) results.push(item);
    }
  }

  // Ability special-case preserved: learned-but-unslotted abilities count as Ability items.
  if (category === "Ability") {
    for (const ability of inventory.learnedAbilities) results.push(ability);
  }

  return results;
}

export function countTotalItems(inventory: UnifiedInventorySnapshot): number {
  let count = inventory.backpack.size() + inventory.learnedAbilities.size();
  for (const [, bucket] of pairs(inventory.loadout)) {
    for (const [, item] of pairs(bucket)) {
      if (item !== undefined) count++;
    }
  }
  return count;
}

/** Count occupied slots in one category's loadout bucket. Replaces the pre-revamp
 *  named-bucket counting (e.g. AdminProfileService's `countRecordEntries(loadout.equipment)`). */
export function countItemsInCategory(inventory: UnifiedInventorySnapshot, categoryKey: SlotCategoryKey): number {
  let count = 0;
  const bucket = inventory.loadout[categoryKey];
  if (bucket !== undefined) {
    for (const [, item] of pairs(bucket)) {
      if (item !== undefined) count++;
    }
  }
  return count;
}

// ── Drag-Drop Validation ─────────────────────────────────────────────────────

export function validateDragDrop(
  payload: SlotDragPayload,
  targetSlotType: string,
  playerLevel: number,
  // v1.0: optional. Drag-drop validates from the payload's embedded catalogEntry; the
  // package's catalog-store is the resolver for callers that prefer registry lookup.
  _catalogLookup?: (id: string) => BaseSlotableCatalogEntry | undefined,
): SlotDropResult {
  const { instance, catalogEntry } = payload;

  if (catalogEntry.requiredLevel !== undefined && playerLevel < catalogEntry.requiredLevel) {
    return { success: false, reason: "LevelRequirementNotMet" };
  }

  if (instance.isLocked) {
    return { success: false, reason: "ItemLocked" };
  }

  const targetCategory = getSlotCategoryFromSlotType(targetSlotType);

  let itemEquipmentSlot: EquipmentSlotKey | undefined;
  let targetEquipmentSlot: EquipmentSlotKey | undefined;

  if (instance.slotCategory === "Equipment" && "equipmentSlot" in instance) {
    itemEquipmentSlot = (instance as EquipmentItemInstance).equipmentSlot;
  }

  if (targetCategory === "Equipment") {
    targetEquipmentSlot = targetSlotType as EquipmentSlotKey;
  }

  const canFit = canItemFitInSlot(
    instance.slotCategory,
    itemEquipmentSlot,
    targetCategory,
    targetEquipmentSlot,
  );

  if (!canFit) {
    return { success: false, reason: "IncompatibleSlot" };
  }

  if (payload.sourceSlot === targetSlotType) {
    return { success: false, reason: "SameSlot" };
  }

  return { success: true };
}

// ── Typed Accessors (recover built-in static typing over the open map) ────────
// Game-defined categories read via `loadout[categoryKey]?.[slotKey]` and cast (the
// package's standard consumers-cast idiom, same as StatModifiers).

export function getEquipmentSlot(loadout: UnifiedLoadout, slot: EquipmentSlotKey): EquipmentItemInstance | undefined {
  const bucket = loadout["Equipment"];
  return bucket !== undefined ? (bucket[slot] as EquipmentItemInstance | undefined) : undefined;
}

export function getAccessorySlot(loadout: UnifiedLoadout, slot: AccessorySlotKey): AccessoryItemInstance | undefined {
  const bucket = loadout["Accessory"];
  return bucket !== undefined ? (bucket[slot] as AccessoryItemInstance | undefined) : undefined;
}

export function getSoulGemSlot(loadout: UnifiedLoadout, slot: SoulGemSlotKey): SoulGemItemInstance | undefined {
  const bucket = loadout["SoulGem"];
  return bucket !== undefined ? (bucket[slot] as SoulGemItemInstance | undefined) : undefined;
}

export function getAbilitySlot(loadout: UnifiedLoadout, slot: AbilitySlotKey): AbilityItemInstance | undefined {
  const bucket = loadout["Ability"];
  return bucket !== undefined ? (bucket[slot] as AbilityItemInstance | undefined) : undefined;
}

export function getConsumableSlot(loadout: UnifiedLoadout, slot: ConsumableSlotKey): ConsumableItemInstance | undefined {
  const bucket = loadout["Consumable"];
  return bucket !== undefined ? (bucket[slot] as ConsumableItemInstance | undefined) : undefined;
}

// ── Operation Types ──────────────────────────────────────────────────────────

export type InventoryOperationType =
  | "Equip"
  | "Unequip"
  | "Swap"
  | "Discard"
  | "Stack"
  | "Split";

export interface InventoryOperationResult {
  readonly success: boolean;
  readonly operation: InventoryOperationType;
  readonly updatedInventory?: UnifiedInventorySnapshot;
  readonly reason?: string;
}
