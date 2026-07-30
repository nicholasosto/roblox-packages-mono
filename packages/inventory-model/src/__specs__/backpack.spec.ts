// ─── Inventory Model: Spec Suite ──────────────────────────────────────────────
//
// The first eight groups are a faithful port of the Studio UI lab's
// InventoryModel_Test.luau — same fixtures, same assertions, same guarantees — so a
// regression here is a regression against the behaviour that was proven in-Studio.
// The remaining groups cover surface the Luau original had no way to express.

import { describe, it, expect, expectEqual } from "./harness";
import type { ItemDefinition, ItemId } from "../types";
import { EMPTY_SLOT } from "../types";
import { createCatalog, createPermissiveCatalog } from "../catalog";
import {
  applyMove,
  createBackpack,
  DEFAULT_CAPACITY,
  getSlot,
  isValidSlot,
  move,
  occupiedSlots,
  reconcile,
} from "../backpack";

/**
 * Marker export — do not remove. A Luau ModuleScript must return exactly one value,
 * but a side-effect-only module (nothing but top-level `describe()` calls) compiles to
 * a chunk with no `return`, and requiring it fails with "Module code did not return
 * exactly one value". One export is enough to make the module return a table.
 */
export const SPEC_MODULE = "inventory-model/backpack";

// ── Fixtures ──────────────────────────────────────────────────────────────────
// Game content lives in the spec, not in src/ (repo convention 5). These four are
// the lab prototype's demo items, kept identical so the ported assertions still bite.

const DEFINITIONS: readonly ItemDefinition[] = [
  { id: "iron-sword", name: "Iron Sword", icon: "⚔️", rarity: "Common", rarityColor: [180, 180, 190] },
  { id: "health-potion", name: "Health Potion", icon: "🧪", rarity: "Common", rarityColor: [100, 200, 100] },
  { id: "magic-shield", name: "Magic Shield", icon: "🛡️", rarity: "Rare", rarityColor: [80, 130, 220] },
  { id: "fire-staff", name: "Fire Staff", icon: "🔥", rarity: "Epic", rarityColor: [230, 100, 50] },
];

const CATALOG = createCatalog(DEFINITIONS);

const DEFAULT_LAYOUT: readonly ItemId[] = [
  "iron-sword",
  "health-potion",
  "magic-shield",
  "fire-staff",
  EMPTY_SLOT,
  EMPTY_SLOT,
];

/** The lab's starting inventory, rebuilt through the public API. */
function defaultBackpack() {
  return reconcile({ slots: DEFAULT_LAYOUT }, CATALOG, DEFAULT_CAPACITY);
}

// ── Ported from InventoryModel_Test.luau ──────────────────────────────────────

describe("default inventory", () => {
  it("has the prototype's six slots and starting layout", () => {
    const state = defaultBackpack();
    expectEqual(state.capacity, 6);
    expectEqual(state.slots.size(), 6);
    expectEqual(getSlot(state, 1), "iron-sword");
    expectEqual(getSlot(state, 4), "fire-staff");
    expectEqual(getSlot(state, 5), EMPTY_SLOT);
  });

  it("starts empty when created without a layout", () => {
    const state = createBackpack();
    expectEqual(state.capacity, DEFAULT_CAPACITY);
    expectEqual(occupiedSlots(state).size(), 0);
  });
});

describe("move into an empty slot", () => {
  it("reports INVENTORY_MOVED and relocates the item", () => {
    const state = defaultBackpack();
    const result = move(state, 1, 5, "iron-sword");

    expectEqual(result.ok, true);
    expectEqual(result.code, "INVENTORY_MOVED");
    expectEqual(result.slots[0], EMPTY_SLOT);
    expectEqual(result.slots[4], "iron-sword");
  });

  it("does not mutate its input", () => {
    const state = defaultBackpack();
    move(state, 1, 5, "iron-sword");
    expectEqual(getSlot(state, 1), "iron-sword", "Move must not mutate its input");
    expectEqual(getSlot(state, 5), EMPTY_SLOT, "Move must not mutate its input");
  });
});

describe("move onto an occupied slot", () => {
  it("reports INVENTORY_SWAPPED and exchanges both items", () => {
    const state = defaultBackpack();
    const result = move(state, 2, 3, "health-potion");

    expectEqual(result.ok, true);
    expectEqual(result.code, "INVENTORY_SWAPPED");
    expectEqual(result.slots[1], "magic-shield");
    expectEqual(result.slots[2], "health-potion");
    expect(result.ok === true && result.move.displacedItemId === "magic-shield", "displaced item is reported");
  });
});

describe("move rejections", () => {
  it("rejects a move to the same slot", () => {
    const result = move(defaultBackpack(), 1, 1, "iron-sword");
    expectEqual(result.ok, false);
    expectEqual(result.code, "SAME_SLOT");
  });

  it("rejects a move out of an empty slot", () => {
    const result = move(defaultBackpack(), 6, 1, EMPTY_SLOT);
    expectEqual(result.ok, false);
    expectEqual(result.code, "SOURCE_EMPTY");
  });

  it("rejects a move whose expected item no longer matches", () => {
    const result = move(defaultBackpack(), 1, 5, "fire-staff");
    expectEqual(result.ok, false);
    expectEqual(result.code, "STALE_SOURCE_ITEM");
  });
});

describe("reconcile", () => {
  it("drops duplicates, unknown ids, and non-strings", () => {
    const state = reconcile(
      {
        slots: ["iron-sword", "iron-sword", "unknown-item", "fire-staff", false, "health-potion"],
      },
      CATALOG,
      DEFAULT_CAPACITY,
    );

    expectEqual(getSlot(state, 1), "iron-sword");
    expectEqual(getSlot(state, 2), EMPTY_SLOT, "Duplicate item IDs must be removed");
    expectEqual(getSlot(state, 3), EMPTY_SLOT, "Unknown item IDs must be removed");
    expectEqual(getSlot(state, 4), "fire-staff");
    expectEqual(getSlot(state, 5), EMPTY_SLOT, "Non-string slot values must be removed");
    expectEqual(getSlot(state, 6), "health-potion");
  });
});

describe("catalog", () => {
  it("clones definitions on read", () => {
    const item = CATALOG.get("magic-shield");
    expect(item !== undefined, "magic-shield must resolve");
    expectEqual(item!.name, "Magic Shield");
    expectEqual(item!.rarity, "Rare");

    // Deliberately defeat `readonly` — the point is to prove a caller CANNOT reach the
    // catalog's copy this way, which is only observable by trying.
    (item!.rarityColor as unknown as Array<number>)[0] = 0;
    const reread = CATALOG.get("magic-shield");
    expectEqual(reread!.rarityColor[0], 80, "Item definitions must be cloned");
  });
});

// ── Beyond the Luau original ──────────────────────────────────────────────────

describe("slot validation", () => {
  it("rejects out-of-range and fractional slot numbers", () => {
    const state = defaultBackpack();
    expectEqual(isValidSlot(state, 0), false);
    expectEqual(isValidSlot(state, 7), false);
    expectEqual(isValidSlot(state, 1.5), false);
    expectEqual(isValidSlot(state, -1), false);
    expectEqual(isValidSlot(state, 1), true);
    expectEqual(isValidSlot(state, 6), true);
  });

  it("surfaces bad slot numbers as distinct result codes", () => {
    const state = defaultBackpack();
    expectEqual(move(state, 0, 2, "iron-sword").code, "INVALID_SOURCE_SLOT");
    expectEqual(move(state, 1, 99, "iron-sword").code, "INVALID_TARGET_SLOT");
  });

  it("reads out-of-range slots as empty rather than erroring", () => {
    const state = defaultBackpack();
    expectEqual(getSlot(state, 0), EMPTY_SLOT);
    expectEqual(getSlot(state, 99), EMPTY_SLOT);
  });
});

describe("capacity", () => {
  it("honours a non-default capacity", () => {
    const state = reconcile({ slots: DEFAULT_LAYOUT }, CATALOG, 3);
    expectEqual(state.capacity, 3);
    expectEqual(state.slots.size(), 3);
    expectEqual(getSlot(state, 3), "magic-shield");
    expectEqual(isValidSlot(state, 4), false, "slot 4 is out of range at capacity 3");
  });
});

describe("malformed storage", () => {
  it("yields an empty backpack rather than throwing", () => {
    expectEqual(occupiedSlots(reconcile(undefined, CATALOG)).size(), 0);
    expectEqual(occupiedSlots(reconcile("not-a-table", CATALOG)).size(), 0);
    expectEqual(occupiedSlots(reconcile({}, CATALOG)).size(), 0);
    expectEqual(occupiedSlots(reconcile({ slots: "nope" }, CATALOG)).size(), 0);
  });
});

describe("permissive catalog", () => {
  it("accepts any non-empty id", () => {
    const state = reconcile({ slots: ["anything", EMPTY_SLOT, "else"] }, createPermissiveCatalog(), 3);
    expectEqual(getSlot(state, 1), "anything");
    expectEqual(getSlot(state, 2), EMPTY_SLOT);
    expectEqual(getSlot(state, 3), "else");
  });
});

describe("applyMove", () => {
  it("advances state on success and holds it on failure", () => {
    const state = defaultBackpack();

    const good = applyMove(state, move(state, 1, 5, "iron-sword"));
    expectEqual(getSlot(good, 5), "iron-sword");
    expectEqual(getSlot(good, 1), EMPTY_SLOT);
    expectEqual(good.capacity, state.capacity);

    const bad = applyMove(state, move(state, 1, 1, "iron-sword"));
    expectEqual(getSlot(bad, 1), "iron-sword");
  });
});

describe("occupiedSlots", () => {
  it("lists 1-based positions in order", () => {
    const pairsFound = occupiedSlots(defaultBackpack());
    expectEqual(pairsFound.size(), 4);
    expectEqual(pairsFound[0][0], 1);
    expectEqual(pairsFound[0][1], "iron-sword");
    expectEqual(pairsFound[3][0], 4);
    expectEqual(pairsFound[3][1], "fire-staff");
  });
});
