// ─── Slotable Items: Slot Category Registry (the open core) ───────────────────
//
// THE revamp. Categories are REGISTERED, not hardcoded. The package self-registers
// its five built-ins (below); a consuming game calls registerSlotCategory() at boot
// to add its own — "Tower", "Pet", "Mount" — with ZERO package edits.
//
// All slot routing/compatibility logic lives here (one implementation, registry-backed),
// replacing the pre-revamp duplicated `getSlotCategory` / `getSlotCategoryFromSlotType`
// and the fragile `string.sub` prefix-matching with its silent "Equipment" fallback.

import {
  EQUIPMENT_SLOT_KEYS,
  ACCESSORY_SLOT_KEYS,
  SOUL_GEM_SLOT_KEYS,
  ABILITY_SLOT_KEYS,
  CONSUMABLE_SLOT_KEYS,
} from "./slot-types";
import type { SlotCategoryKey, UniversalSlotTypeKey } from "./slot-types";

// ── Descriptor ────────────────────────────────────────────────────────────────

export type SlotMatchMode = "strict" | "any-in-category";

export interface SlotCategoryDescriptor {
  /** Unique category key, e.g. "Equipment" or a game-defined "Tower". */
  readonly key: string;
  /** The slot keys this category exposes. */
  readonly slotKeys: readonly string[];
  /**
   * "strict": an item fits only its exact same-named slot (Equipment: Head → Head only).
   * "any-in-category": an item fits any slot in the category (SoulGem, Ability, Consumable…).
   */
  readonly matchMode: SlotMatchMode;
  /**
   * Optional dynamic slot-unlocking by player level — generalizes the built-in
   * `getUnlockedSoulGemSlots`. Returns the subset of `slotKeys` unlocked at `playerLevel`.
   */
  readonly slotUnlock?: (playerLevel: number) => readonly string[];
}

// ── Storage ───────────────────────────────────────────────────────────────────

const categories = new Map<string, SlotCategoryDescriptor>();
const slotToCategory = new Map<string, string>(); // reverse index: slot key → category key

// ── Registration API ────────────────────────────────────────────────────────

/**
 * Register (or override) a slot category. The package self-registers the five built-ins;
 * consuming games call this at boot to add their own categories with no package edits.
 */
export function registerSlotCategory(descriptor: SlotCategoryDescriptor): void {
  if (categories.has(descriptor.key)) {
    warn(`[slotable-items] Overriding already-registered slot category "${descriptor.key}".`);
    const stale: string[] = [];
    for (const [slotKey, catKey] of slotToCategory) {
      if (catKey === descriptor.key) stale.push(slotKey);
    }
    for (const slotKey of stale) slotToCategory.delete(slotKey);
  }
  categories.set(descriptor.key, descriptor);
  for (const slotKey of descriptor.slotKeys) {
    const existing = slotToCategory.get(slotKey);
    if (existing !== undefined && existing !== descriptor.key) {
      warn(
        `[slotable-items] Slot key "${slotKey}" was owned by category "${existing}"; reassigning to "${descriptor.key}".`,
      );
    }
    slotToCategory.set(slotKey, descriptor.key);
  }
}

export function getRegisteredCategory(key: string): SlotCategoryDescriptor | undefined {
  return categories.get(key);
}

export function isCategoryRegistered(key: string): boolean {
  return categories.has(key);
}

export function listSlotCategories(): SlotCategoryDescriptor[] {
  const out: SlotCategoryDescriptor[] = [];
  for (const [, desc] of categories) out.push(desc);
  return out;
}

export function listCategoryKeys(): string[] {
  const out: string[] = [];
  for (const [key] of categories) out.push(key);
  return out;
}

/**
 * Honest slot → category lookup. Returns `undefined` for an unregistered slot key
 * (the pre-revamp `getSlotCategory`/`getSlotCategoryFromSlotType` silently returned
 * "Equipment" — a latent bug; new code should prefer this fallback-free primitive).
 */
export function getCategoryForSlot(slotKey: string): string | undefined {
  return slotToCategory.get(slotKey);
}

// ── Routing / Compatibility (registry-backed; one implementation) ─────────────

/**
 * Slot key → category key. Preserves the historical "Equipment" fallback so cutover
 * is drop-in; new code should prefer `getCategoryForSlot` (undefined on unknown).
 */
export function getSlotCategory(slotType: UniversalSlotTypeKey): SlotCategoryKey {
  return getCategoryForSlot(slotType) ?? "Equipment";
}

/** True if the slot's category uses strict (1:1) matching. */
export function isStrictSlotType(slotType: UniversalSlotTypeKey): boolean {
  const cat = getCategoryForSlot(slotType);
  if (cat === undefined) return false;
  const desc = categories.get(cat);
  return desc !== undefined && desc.matchMode === "strict";
}

/** Can an item from `itemSlotType` be placed in `targetSlotType`? Same category required;
 *  strict categories need an exact slot match, others accept any slot in the category. */
export function isItemCompatibleWithSlot(
  itemSlotType: UniversalSlotTypeKey,
  targetSlotType: UniversalSlotTypeKey,
): boolean {
  const itemCategory = getCategoryForSlot(itemSlotType);
  const targetCategory = getCategoryForSlot(targetSlotType);
  if (itemCategory === undefined || targetCategory === undefined) return false;
  if (itemCategory !== targetCategory) return false;
  const desc = categories.get(itemCategory);
  if (desc !== undefined && desc.matchMode === "strict") {
    return itemSlotType === targetSlotType;
  }
  return true;
}

/** All slot keys compatible with the given item slot type. */
export function getCompatibleSlots(itemSlotType: UniversalSlotTypeKey): readonly UniversalSlotTypeKey[] {
  const cat = getCategoryForSlot(itemSlotType);
  if (cat === undefined) return [];
  const desc = categories.get(cat);
  if (desc === undefined) return [];
  if (desc.matchMode === "strict") return [itemSlotType];
  return desc.slotKeys;
}

// ── Self-register the five built-ins ──────────────────────────────────────────
// Equipment is strict (Head → Head); the rest accept any slot within the category —
// identical behavior to the pre-revamp hardcoded switch.

registerSlotCategory({ key: "Equipment", slotKeys: EQUIPMENT_SLOT_KEYS, matchMode: "strict" });
registerSlotCategory({ key: "Accessory", slotKeys: ACCESSORY_SLOT_KEYS, matchMode: "any-in-category" });
registerSlotCategory({ key: "SoulGem", slotKeys: SOUL_GEM_SLOT_KEYS, matchMode: "any-in-category" });
registerSlotCategory({ key: "Ability", slotKeys: ABILITY_SLOT_KEYS, matchMode: "any-in-category" });
registerSlotCategory({ key: "Consumable", slotKeys: CONSUMABLE_SLOT_KEYS, matchMode: "any-in-category" });
