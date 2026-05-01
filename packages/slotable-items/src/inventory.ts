// ─── Slotable Items: Unified Inventory ────────────────────────────────────────
import type { SlotCategoryKey, EquipmentSlotKey } from './slot-types';
import type {
  BaseSlotableCatalogEntry,
  BaseSlotableInstance,
  SlotDragPayload,
  SlotDropResult,
} from './base-types';
import { canItemFitInSlot, getSlotCategoryFromSlotType } from './base-types';
import type { EquipmentItemInstance, EquipmentLoadout } from './equipment-types';
import { DEFAULT_EQUIPMENT_LOADOUT } from './equipment-types';
import type { AccessoryItemInstance, AccessoryLoadout } from './accessory-types';
import { DEFAULT_ACCESSORY_LOADOUT } from './accessory-types';
import type { ConsumableItemInstance, ConsumableLoadout } from './consumable-types';
import { DEFAULT_CONSUMABLE_LOADOUT } from './consumable-types';
import type { AbilityItemInstance, AbilityInstanceLoadout } from './ability-types';
import { DEFAULT_ABILITY_INSTANCE_LOADOUT } from './ability-types';
import type { SoulGemItemInstance, SoulGemLoadout } from './soul-gem-types';
import { DEFAULT_SOUL_GEM_LOADOUT } from './soul-gem-types';

// ── Union Types ──────────────────────────────────────────────────────────────

export type AnySlotableInstance =
  | EquipmentItemInstance
  | AccessoryItemInstance
  | SoulGemItemInstance
  | AbilityItemInstance
  | ConsumableItemInstance;

export type AnySlotableCatalogEntry = BaseSlotableCatalogEntry;

// ── Unified Loadout ──────────────────────────────────────────────────────────

export interface UnifiedLoadout {
  readonly equipment: EquipmentLoadout;
  readonly accessories: AccessoryLoadout;
  readonly soulGems: SoulGemLoadout;
  readonly abilities: AbilityInstanceLoadout;
  readonly consumables: ConsumableLoadout;
}

export const DEFAULT_UNIFIED_LOADOUT: UnifiedLoadout = {
  equipment: DEFAULT_EQUIPMENT_LOADOUT,
  accessories: DEFAULT_ACCESSORY_LOADOUT,
  soulGems: DEFAULT_SOUL_GEM_LOADOUT,
  abilities: DEFAULT_ABILITY_INSTANCE_LOADOUT,
  consumables: DEFAULT_CONSUMABLE_LOADOUT,
};

// ── Unified Inventory Snapshot ───────────────────────────────────────────────

export interface UnifiedInventorySnapshot {
  readonly loadout: UnifiedLoadout;
  readonly backpack: readonly AnySlotableInstance[];
  readonly learnedAbilities: readonly AbilityItemInstance[];
  readonly backpackCapacity: number;
}

export const DEFAULT_UNIFIED_INVENTORY: UnifiedInventorySnapshot = {
  loadout: DEFAULT_UNIFIED_LOADOUT,
  backpack: [],
  learnedAbilities: [],
  backpackCapacity: 100,
};

// ── Query Utilities ──────────────────────────────────────────────────────────

export function findItemByGuid(
  inventory: UnifiedInventorySnapshot,
  guid: string,
): { item: AnySlotableInstance; location: "loadout" | "backpack" | "abilities"; slot?: string } | undefined {
  for (const item of inventory.backpack) {
    if (item.guid === guid) return { item, location: "backpack" };
  }
  for (const ability of inventory.learnedAbilities) {
    if (ability.guid === guid) return { item: ability, location: "abilities" };
  }
  for (const [slot, item] of pairs(inventory.loadout.equipment)) {
    if (item && item.guid === guid) return { item, location: "loadout", slot };
  }
  for (const [slot, item] of pairs(inventory.loadout.accessories)) {
    if (item && item.guid === guid) return { item, location: "loadout", slot };
  }
  for (const [slot, item] of pairs(inventory.loadout.soulGems)) {
    if (item && item.guid === guid) return { item, location: "loadout", slot };
  }
  for (const [slot, item] of pairs(inventory.loadout.abilities)) {
    if (item && item.guid === guid) return { item, location: "loadout", slot };
  }
  for (const [slot, item] of pairs(inventory.loadout.consumables)) {
    if (item && item.guid === guid) return { item, location: "loadout", slot };
  }
  return undefined;
}

export function getItemsByCategory(
  inventory: UnifiedInventorySnapshot,
  category: SlotCategoryKey,
): AnySlotableInstance[] {
  const results: AnySlotableInstance[] = [];

  for (const item of inventory.backpack) {
    if (item.slotCategory === category) results.push(item);
  }

  switch (category) {
    case "Equipment":
      for (const [_, item] of pairs(inventory.loadout.equipment)) {
        if (item) results.push(item);
      }
      break;
    case "Accessory":
      for (const [_, item] of pairs(inventory.loadout.accessories)) {
        if (item) results.push(item);
      }
      break;
    case "SoulGem":
      for (const [_, item] of pairs(inventory.loadout.soulGems)) {
        if (item) results.push(item);
      }
      break;
    case "Ability":
      for (const [_, item] of pairs(inventory.loadout.abilities)) {
        if (item) results.push(item);
      }
      for (const ability of inventory.learnedAbilities) {
        results.push(ability);
      }
      break;
    case "Consumable":
      for (const [_, item] of pairs(inventory.loadout.consumables)) {
        if (item) results.push(item);
      }
      break;
  }

  return results;
}

export function countTotalItems(inventory: UnifiedInventorySnapshot): number {
  let count = inventory.backpack.size();
  count += inventory.learnedAbilities.size();

  for (const [_, item] of pairs(inventory.loadout.equipment)) {
    if (item) count++;
  }
  for (const [_, item] of pairs(inventory.loadout.accessories)) {
    if (item) count++;
  }
  for (const [_, item] of pairs(inventory.loadout.soulGems)) {
    if (item) count++;
  }
  for (const [_, item] of pairs(inventory.loadout.abilities)) {
    if (item) count++;
  }
  for (const [_, item] of pairs(inventory.loadout.consumables)) {
    if (item) count++;
  }

  return count;
}

// ── Drag-Drop Validation ─────────────────────────────────────────────────────

export function validateDragDrop(
  payload: SlotDragPayload,
  targetSlotType: string,
  playerLevel: number,
  _catalogLookup: (id: string) => BaseSlotableCatalogEntry | undefined,
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
