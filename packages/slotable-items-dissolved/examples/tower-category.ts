// ─── Openness Acceptance Test (ADR 0005 definition-of-done) ───────────────────
// Proves a CONSUMER can register a brand-new slot category ("Tower") and
// equip/query it through the package's generic API with ZERO package edits.
// Compiled as part of the dissolved build to verify the open contract typechecks;
// relocate to examples/ for the clean package (it is not part of the public API).

import {
  registerSlotCategory,
  getCategoryForSlot,
  isItemCompatibleWithSlot,
  getCompatibleSlots,
  createEmptyLoadout,
  findItemByGuid,
  countItemsInCategory,
  getItemsByCategory,
} from "./index";
import type { BaseSlotableInstance, UnifiedLoadout, UnifiedInventorySnapshot } from "./index";

// 1. Register a brand-new category. No package source file was edited to add it.
registerSlotCategory({
  key: "Tower",
  slotKeys: ["Tower1", "Tower2", "Tower3", "Tower4", "Tower5", "Tower6"],
  matchMode: "any-in-category",
});

// 2. Routing recognizes the new category (and rejects unknowns — no silent fallback).
assert(getCategoryForSlot("Tower3") === "Tower", "Tower3 routes to the Tower category");
assert(getCategoryForSlot("NoSuchSlot") === undefined, "unknown slot → undefined (fallback-free)");
assert(isItemCompatibleWithSlot("Tower1", "Tower5"), "any-in-category: a Tower item fits any Tower slot");
assert(getCompatibleSlots("Tower2").size() === 6, "Tower exposes its 6 slots");

// 3. Own + equip a Tower instance ("one owned instance per unlocked tower type").
const tower: BaseSlotableInstance = {
  guid: "tower-guid-001",
  catalogId: "sentry",
  slotCategory: "Tower",
  quantity: 1,
  acquiredAt: 0,
  ownerUserId: 1,
};
const loadout: UnifiedLoadout = createEmptyLoadout();
assert(loadout["Tower"] !== undefined, "a fresh loadout includes the registered Tower bucket");
loadout["Tower"]!["Tower1"] = tower;

// 4. Query via the package's generic functions — Tower is a first-class citizen.
const inv: UnifiedInventorySnapshot = {
  loadout,
  backpack: [],
  learnedAbilities: [],
  backpackCapacity: 100,
};
const found = findItemByGuid(inv, "tower-guid-001");
assert(found !== undefined && found.item.guid === "tower-guid-001", "findItemByGuid finds the equipped tower");
assert(countItemsInCategory(inv, "Tower") === 1, "exactly one tower is equipped");
assert(getItemsByCategory(inv, "Tower").size() === 1, "getItemsByCategory returns the tower");

print("[slotable-items] Tower-category openness acceptance: PASS");
