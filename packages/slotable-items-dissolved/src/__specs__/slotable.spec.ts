// ─── Slotable Items: v1.0 Spec Suite ──────────────────────────────────────────
// Pure, headless coverage of the whole v1.0 surface. Run via runSlotableItemSpecs().

import { describe, it, expect, expectEqual, expectApprox } from "./harness";
import type { UIDisplayMeta } from "../types";
import type { BaseSlotableCatalogEntry, BaseSlotableInstance } from "../base-types";
import type { ModifierContribution } from "../modifier-types";
import {
  registerSlotCategory, getCategoryForSlot, isCategoryRegistered,
} from "../slot-category-registry";
import {
  registerItemKind, getKindForCategory, isKindRegistered, createInstanceForEntry, defineItemKind,
} from "../item-kind-registry";
import { registerCatalogEntry, getCatalogEntry, hasCatalogEntry } from "../catalog-store";
import type { InventoryDraft, EngineContext } from "../engine";
import { equipItem, unequipSlot, swapSlots, grantItem, removeItem, activateSlot, preview } from "../engine";
import { computeActiveModifiers, loadoutSignature } from "../modifiers";
import { createEmptyLoadout } from "../inventory";
import type { UnifiedInventorySnapshot } from "../inventory";
import { auditRegistries } from "../registry-health";

const DISPLAY: UIDisplayMeta = { displayName: "Spec", description: "spec fixture", icon: "" };
const CTX: EngineContext = { playerLevel: 100, ownerUserId: 1 };

interface GlyphCatalogEntry extends BaseSlotableCatalogEntry {
  readonly contribs: readonly Omit<ModifierContribution, "sourceGuid">[];
}

let didSetup = false;
function setup(): void {
  if (didSetup) return;
  didSetup = true;

  // Built-in Equipment / Consumable fixtures (kinds already registered via built-ins).
  registerCatalogEntry(
    { id: "spec_helm", display: DISPLAY, rarity: "Common", slotCategory: "Equipment", equipmentSlot: "Head", modifiers: { Armor: 10 } } as unknown as BaseSlotableCatalogEntry,
    { silent: true },
  );
  registerCatalogEntry(
    { id: "spec_boots", display: DISPLAY, rarity: "Common", slotCategory: "Equipment", equipmentSlot: "Feet", modifiers: { Speed: 3 } } as unknown as BaseSlotableCatalogEntry,
    { silent: true },
  );
  registerCatalogEntry(
    { id: "spec_potion", display: DISPLAY, rarity: "Common", slotCategory: "Consumable", maxStackSize: 99, cooldownSec: 5 } as unknown as BaseSlotableCatalogEntry,
    { silent: true },
  );

  // Custom Glyph kind — contributions encoded on the catalog entry for fold-math tests.
  registerSlotCategory({ key: "Glyph", slotKeys: ["Glyph1", "Glyph2", "Glyph3", "Glyph4"], matchMode: "any-in-category" });
  registerItemKind<GlyphCatalogEntry, BaseSlotableInstance>({
    kind: "Glyph",
    defaultSlotCategory: "Glyph",
    createInstance: (entry, guid, owner) => ({
      guid, catalogId: entry.id, slotCategory: "Glyph", quantity: 1, acquiredAt: 0, ownerUserId: owner, isNew: true,
    }),
    contributeModifiers: (inst, entry) => entry.contribs.map((c) => ({ ...c, sourceGuid: inst.guid })),
  });
  const glyph = (id: string, contribs: readonly Omit<ModifierContribution, "sourceGuid">[]): void => {
    registerCatalogEntry({ id, display: DISPLAY, rarity: "Common", slotCategory: "Glyph", contribs } as unknown as BaseSlotableCatalogEntry, { silent: true });
  };
  glyph("g_add_a", [{ stat: "Dmg", value: 10, op: "add", scope: "Glyph" }]);
  glyph("g_add_b", [{ stat: "Dmg", value: 5, op: "add", scope: "Glyph" }]);
  glyph("g_mul_a", [{ stat: "Dmg", value: 0.1, op: "mul", scope: "Glyph" }]);
  glyph("g_mul_a2", [{ stat: "Dmg", value: 0.1, op: "mul", scope: "Glyph" }]);
  glyph("g_mul_b", [{ stat: "Dmg", value: 0.1, op: "mul", scope: "Other" }]);
  glyph("g_excl_lo", [{ stat: "Aura", value: 5, op: "add", scope: "X", exclusiveGroup: "aura" }]);
  glyph("g_excl_hi", [{ stat: "Aura", value: 12, op: "add", scope: "X", exclusiveGroup: "aura" }]);

  // Level-gated category fixture (Gated2 unlocks at level 10).
  registerSlotCategory({
    key: "Gated", slotKeys: ["Gated1", "Gated2"], matchMode: "any-in-category",
    slotUnlock: (lvl) => (lvl >= 10 ? ["Gated1", "Gated2"] : ["Gated1"]),
  });
  registerItemKind({
    kind: "Gated",
    defaultSlotCategory: "Gated",
    createInstance: (entry, guid, owner) => ({
      guid, catalogId: entry.id, slotCategory: "Gated", quantity: 1, acquiredAt: 0, ownerUserId: owner,
    }),
  });
  registerCatalogEntry({ id: "spec_gated", display: DISPLAY, rarity: "Common", slotCategory: "Gated" } as unknown as BaseSlotableCatalogEntry, { silent: true });

  // Rune category for the defineItemKind end-to-end test.
  registerSlotCategory({ key: "Rune", slotKeys: ["Rune1", "Rune2", "Rune3"], matchMode: "any-in-category" });

  // A deliberate orphan: catalog entry pointing at an unregistered category.
  registerCatalogEntry({ id: "spec_orphan", display: DISPLAY, rarity: "Common", slotCategory: "NoSuchCat" } as unknown as BaseSlotableCatalogEntry, { silent: true });
}

function freshDraft(capacity = 100): InventoryDraft {
  return { loadout: createEmptyLoadout(), backpack: [], learnedAbilities: [], backpackCapacity: capacity };
}
function asSnapshot(draft: InventoryDraft): UnifiedInventorySnapshot {
  return draft as unknown as UnifiedInventorySnapshot;
}
function grantAndGet(draft: InventoryDraft, catalogId: string, ctx: EngineContext = CTX): BaseSlotableInstance {
  const r = grantItem(draft, { catalogId, source: "spec" }, ctx);
  expect(r.success, `grant ${catalogId} should succeed (reason: ${tostring(r.reason)})`);
  return r.item!;
}

// ── Registries ─────────────────────────────────────────────────────────────────

describe("slot-category registry", () => {
  it("built-in categories are registered", () => {
    expect(isCategoryRegistered("Equipment"));
    expect(isCategoryRegistered("SoulGem"));
    expect(isCategoryRegistered("Consumable"));
  });
  it("routes known slots and rejects unknown (no silent fallback)", () => {
    expectEqual(getCategoryForSlot("Head"), "Equipment");
    expectEqual(getCategoryForSlot("SoulGem2"), "SoulGem");
    expectEqual(getCategoryForSlot("NoSuchSlot"), undefined);
  });
});

describe("item-kind registry", () => {
  it("built-in kinds are registered", () => {
    setup();
    expect(isKindRegistered("Equipment"));
    expectEqual(getKindForCategory("Consumable")?.kind, "Consumable");
  });
  it("createInstanceForEntry builds via the kind's factory", () => {
    setup();
    const inst = createInstanceForEntry(getCatalogEntry("spec_helm")!, "g-1", 1);
    expect(inst !== undefined);
    expectEqual(inst!.slotCategory, "Equipment");
    expectEqual(inst!.catalogId, "spec_helm");
  });
});

describe("catalog store", () => {
  it("registers and resolves entries", () => {
    setup();
    expect(hasCatalogEntry("spec_helm"));
    expectEqual(getCatalogEntry("spec_helm")?.id, "spec_helm");
  });
  it("rejects an entry missing required fields", () => {
    const r = registerCatalogEntry({ id: "", display: DISPLAY, rarity: "Common", slotCategory: "Equipment" } as unknown as BaseSlotableCatalogEntry, { silent: true });
    expect(!r.ok);
    expect(r.errors.size() > 0);
  });
  it("warns but accepts an unregistered category", () => {
    const r = registerCatalogEntry({ id: "spec_tmp_orphan", display: DISPLAY, rarity: "Common", slotCategory: "GhostCat" } as unknown as BaseSlotableCatalogEntry, { silent: true });
    expect(r.ok);
    expect(r.warnings.size() > 0);
  });
});

// ── Engine: equip / unequip / swap ──────────────────────────────────────────────

describe("engine — equip/unequip/swap", () => {
  it("equip moves an item from backpack into the slot", () => {
    setup();
    const d = freshDraft();
    const helm = grantAndGet(d, "spec_helm");
    const r = equipItem(d, { itemGuid: helm.guid, targetSlot: "Head" }, CTX);
    expect(r.success, tostring(r.reason));
    expectEqual(d.loadout["Equipment"]!["Head"]?.guid, helm.guid);
    expectEqual(d.backpack.size(), 0);
  });
  it("equip rejects an unknown item", () => {
    const r = equipItem(freshDraft(), { itemGuid: "nope", targetSlot: "Head" }, CTX);
    expect(!r.success);
    expectEqual(r.reason, "ItemNotInInventory");
  });
  it("equip rejects a strict-slot mismatch", () => {
    setup();
    const d = freshDraft();
    const helm = grantAndGet(d, "spec_helm"); // equipmentSlot Head
    const r = equipItem(d, { itemGuid: helm.guid, targetSlot: "Feet" }, CTX);
    expect(!r.success);
    expectEqual(r.reason, "IncompatibleSlot");
  });
  it("equip displaces the existing occupant back to the backpack", () => {
    setup();
    const d = freshDraft();
    const h1 = grantAndGet(d, "spec_helm");
    equipItem(d, { itemGuid: h1.guid, targetSlot: "Head" }, CTX);
    const h2 = grantAndGet(d, "spec_helm");
    const r = equipItem(d, { itemGuid: h2.guid, targetSlot: "Head" }, CTX);
    expect(r.success, tostring(r.reason));
    expectEqual(r.displacedItem?.guid, h1.guid);
    expect(d.backpack.findIndex((i) => i.guid === h1.guid) !== -1);
  });
  it("unequip returns an item to the backpack", () => {
    setup();
    const d = freshDraft();
    const helm = grantAndGet(d, "spec_helm");
    equipItem(d, { itemGuid: helm.guid, targetSlot: "Head" }, CTX);
    const r = unequipSlot(d, { slot: "Head" }, CTX);
    expect(r.success, tostring(r.reason));
    expectEqual(d.backpack.size(), 1);
    expectEqual(d.loadout["Equipment"]!["Head"], undefined);
  });
  it("unequip on an empty slot fails SlotEmpty", () => {
    const r = unequipSlot(freshDraft(), { slot: "Head" }, CTX);
    expect(!r.success);
    expectEqual(r.reason, "SlotEmpty");
  });
  it("swap exchanges two any-in-category slots", () => {
    setup();
    const d = freshDraft();
    const a = grantAndGet(d, "g_add_a");
    const b = grantAndGet(d, "g_add_b");
    equipItem(d, { itemGuid: a.guid, targetSlot: "Glyph1" }, CTX);
    equipItem(d, { itemGuid: b.guid, targetSlot: "Glyph2" }, CTX);
    const r = swapSlots(d, { slotA: "Glyph1", slotB: "Glyph2" }, CTX);
    expect(r.success, tostring(r.reason));
    expectEqual(d.loadout["Glyph"]!["Glyph1"]?.guid, b.guid);
    expectEqual(d.loadout["Glyph"]!["Glyph2"]?.guid, a.guid);
  });
  it("swap of the same slot fails SameSlot", () => {
    const r = swapSlots(freshDraft(), { slotA: "Glyph1", slotB: "Glyph1" }, CTX);
    expect(!r.success);
    expectEqual(r.reason, "SameSlot");
  });
});

// ── Engine: grant / remove / activate ──────────────────────────────────────────

describe("engine — grant/remove/activate", () => {
  it("grant adds a fresh instance to the backpack", () => {
    setup();
    const d = freshDraft();
    const r = grantItem(d, { catalogId: "spec_helm", source: "s" }, CTX);
    expect(r.success);
    expectEqual(d.backpack.size(), 1);
  });
  it("grant of an unknown catalog id fails CatalogMissing", () => {
    const r = grantItem(freshDraft(), { catalogId: "nope", source: "s" }, CTX);
    expect(!r.success);
    expectEqual(r.reason, "CatalogMissing");
  });
  it("grant auto-merges a stackable kind", () => {
    setup();
    const d = freshDraft();
    grantItem(d, { catalogId: "spec_potion", source: "s" }, CTX);
    grantItem(d, { catalogId: "spec_potion", source: "s" }, CTX);
    expectEqual(d.backpack.size(), 1);
    expectEqual(d.backpack[0].quantity, 2);
  });
  it("grant respects backpack capacity", () => {
    setup();
    const d = freshDraft(1);
    grantItem(d, { catalogId: "spec_helm", source: "s" }, CTX);
    const r = grantItem(d, { catalogId: "spec_boots", source: "s" }, CTX);
    expect(!r.success);
    expectEqual(r.reason, "BackpackFull");
  });
  it("remove deletes from the backpack", () => {
    setup();
    const d = freshDraft();
    const h = grantAndGet(d, "spec_helm");
    const r = removeItem(d, { itemGuid: h.guid, reason: "t" }, CTX);
    expect(r.success);
    expectEqual(d.backpack.size(), 0);
  });
  it("remove clears an equipped slot", () => {
    setup();
    const d = freshDraft();
    const h = grantAndGet(d, "spec_helm");
    equipItem(d, { itemGuid: h.guid, targetSlot: "Head" }, CTX);
    const r = removeItem(d, { itemGuid: h.guid, reason: "t" }, CTX);
    expect(r.success);
    expectEqual(d.loadout["Equipment"]!["Head"], undefined);
  });
  it("activate consumes one from a stack and reports cooldown", () => {
    setup();
    const d = freshDraft();
    grantItem(d, { catalogId: "spec_potion", source: "s" }, CTX);
    grantItem(d, { catalogId: "spec_potion", source: "s" }, CTX);
    const stack = d.backpack[0];
    equipItem(d, { itemGuid: stack.guid, targetSlot: "Consumable1" }, CTX);
    const r = activateSlot(d, { slot: "Consumable1" }, CTX);
    expect(r.success, tostring(r.reason));
    expectEqual(r.remainingQuantity, 1);
    expectEqual(r.cooldownSec, 5);
  });
  it("activate to depletion clears the slot", () => {
    setup();
    const d = freshDraft();
    grantItem(d, { catalogId: "spec_potion", source: "s" }, CTX);
    const stack = d.backpack[0];
    equipItem(d, { itemGuid: stack.guid, targetSlot: "Consumable1" }, CTX);
    const r = activateSlot(d, { slot: "Consumable1" }, CTX);
    expect(r.success);
    expectEqual(r.remainingQuantity, 0);
    expectEqual(d.loadout["Consumable"]!["Consumable1"], undefined);
  });
});

// ── Engine: guards ───────────────────────────────────────────────────────────────

describe("engine — guards", () => {
  it("rejects equipping another player's item", () => {
    setup();
    const d = freshDraft();
    const helm = grantAndGet(d, "spec_helm");
    const r = equipItem(d, { itemGuid: helm.guid, targetSlot: "Head" }, { playerLevel: 100, ownerUserId: 999 });
    expect(!r.success);
    expectEqual(r.reason, "OwnershipMismatch");
  });
  it("level-gated slot is locked until the level is reached", () => {
    setup();
    const lowCtx: EngineContext = { playerLevel: 5, ownerUserId: 1 };
    const d = freshDraft();
    const g1 = grantAndGet(d, "spec_gated", lowCtx);
    const locked = equipItem(d, { itemGuid: g1.guid, targetSlot: "Gated2" }, lowCtx);
    expect(!locked.success);
    expectEqual(locked.reason, "SlotLocked");
    const ok = equipItem(d, { itemGuid: g1.guid, targetSlot: "Gated1" }, lowCtx);
    expect(ok.success, tostring(ok.reason));
  });
});

// ── Modifier projection ──────────────────────────────────────────────────────────

describe("modifier projection", () => {
  it("sums additive contributions", () => {
    setup();
    const d = freshDraft();
    const a = grantAndGet(d, "g_add_a");
    const b = grantAndGet(d, "g_add_b");
    equipItem(d, { itemGuid: a.guid, targetSlot: "Glyph1" }, CTX);
    equipItem(d, { itemGuid: b.guid, targetSlot: "Glyph2" }, CTX);
    const m = computeActiveModifiers(asSnapshot(d));
    expectEqual(m.additive["Dmg"], 15);
    expectEqual(m.stats["Dmg"], 15);
  });
  it("adds muls within a scope, then applies them", () => {
    setup();
    const d = freshDraft();
    const a = grantAndGet(d, "g_mul_a");
    const b = grantAndGet(d, "g_mul_a2");
    equipItem(d, { itemGuid: a.guid, targetSlot: "Glyph1" }, CTX);
    equipItem(d, { itemGuid: b.guid, targetSlot: "Glyph2" }, CTX);
    const m = computeActiveModifiers(asSnapshot(d));
    expectApprox(m.multipliers["Dmg"], 1.2, 1e-6);
  });
  it("multiplies mul scopes against each other", () => {
    setup();
    const d = freshDraft();
    const a = grantAndGet(d, "g_mul_a");
    const b = grantAndGet(d, "g_mul_b");
    equipItem(d, { itemGuid: a.guid, targetSlot: "Glyph1" }, CTX);
    equipItem(d, { itemGuid: b.guid, targetSlot: "Glyph2" }, CTX);
    const m = computeActiveModifiers(asSnapshot(d));
    expectApprox(m.multipliers["Dmg"], 1.21, 1e-6);
  });
  it("keeps only the highest contribution in an exclusive group", () => {
    setup();
    const d = freshDraft();
    const lo = grantAndGet(d, "g_excl_lo");
    const hi = grantAndGet(d, "g_excl_hi");
    equipItem(d, { itemGuid: lo.guid, targetSlot: "Glyph1" }, CTX);
    equipItem(d, { itemGuid: hi.guid, targetSlot: "Glyph2" }, CTX);
    const m = computeActiveModifiers(asSnapshot(d));
    expectEqual(m.additive["Aura"], 12);
  });
  it("loadoutSignature changes when the loadout changes", () => {
    setup();
    const d = freshDraft();
    const s0 = loadoutSignature(asSnapshot(d));
    const a = grantAndGet(d, "g_add_a");
    equipItem(d, { itemGuid: a.guid, targetSlot: "Glyph1" }, CTX);
    expect(s0 !== loadoutSignature(asSnapshot(d)));
  });
});

// ── Preview & custom kinds ───────────────────────────────────────────────────────

describe("preview is non-destructive", () => {
  it("preview equip leaves the original snapshot untouched", () => {
    setup();
    const d = freshDraft();
    const h = grantAndGet(d, "spec_helm");
    const out = preview(equipItem, asSnapshot(d), { itemGuid: h.guid, targetSlot: "Head" }, CTX);
    expect(out.result.success, tostring(out.result.reason));
    // Original untouched; clone reflects the equip.
    expectEqual(d.backpack.size(), 1);
    expectEqual(d.loadout["Equipment"]!["Head"], undefined);
    expectEqual(out.snapshot.loadout["Equipment"]!["Head"]?.guid, h.guid);
  });
});

describe("custom kind end-to-end (defineItemKind)", () => {
  it("registers a Rune kind and projects its modifiers with zero package edits", () => {
    setup();
    interface RuneCatalog extends BaseSlotableCatalogEntry {
      readonly power: number;
    }
    interface RuneInstance extends BaseSlotableInstance {
      charges: number;
    }
    const Rune = defineItemKind<RuneCatalog, RuneInstance>({
      kind: "Rune",
      defaultSlotCategory: "Rune",
      createInstance: (entry, guid, owner) => ({
        guid, catalogId: entry.id, slotCategory: "Rune", quantity: 1, acquiredAt: 0, ownerUserId: owner, charges: 3,
      }),
      contributeModifiers: (inst, entry) => [{ stat: "Power", value: entry.power, op: "add", scope: "Rune", sourceGuid: inst.guid }],
    });
    registerCatalogEntry({ id: "spec_rune", display: DISPLAY, rarity: "Rare", slotCategory: "Rune", power: 7 } as unknown as BaseSlotableCatalogEntry, { silent: true });

    const d = freshDraft();
    const r = grantAndGet(d, "spec_rune");
    expectEqual(r.slotCategory, "Rune");
    equipItem(d, { itemGuid: r.guid, targetSlot: "Rune1" }, CTX);

    const typed = Rune.getSlot(d.loadout, "Rune1");
    expect(typed !== undefined);
    expectEqual(typed!.charges, 3);

    const m = computeActiveModifiers(asSnapshot(d));
    expectEqual(m.stats["Power"], 7);
  });
});

// ── Registry health ──────────────────────────────────────────────────────────────

describe("registry health", () => {
  it("audits categories and flags orphaned catalog entries", () => {
    setup();
    const report = auditRegistries();
    expect(report.categories.includes("Equipment"));
    expect(report.orphanedCatalogEntries.findIndex((o) => o.id === "spec_orphan") !== -1);
  });
});
