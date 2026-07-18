// ─── Slotable Items: Persistence Slice ────────────────────────────────────────
//
// Declares the data contract for persisting inventory data via @trembus/persistent-data.
// Games compose this slice into their profile: `type GameProfile = BasePlayerProfile & InventorySliceData`
//
// OPEN-TAXONOMY NOTE: the persisted `inventory.loadout` is now the category-keyed map
// (see inventory.ts). The template covers the built-ins registered at load; buckets for
// game-registered categories are created lazily on first equip, so a profile loaded
// before a game's registerSlotCategory() boot call self-heals. Data is currently dormant
// (empty defaults), so no migration is required; bump `inventoryVersion` + add a migration
// here if a shape change ever lands on top of real player data.
//
// The PersistenceSlice type is imported as type-only — no runtime dependency on persistent-data.
// ──────────────────────────────────────────────────────────────────────────────

import type { PersistenceSlice } from "@trembus/persistent-data";
import { DEFAULT_UNIFIED_INVENTORY } from "./inventory";
import type { UnifiedInventorySnapshot } from "./inventory";
import { getKindForCategory } from "./item-kind-registry";

// ── Slice Data Shape ────────────────────────────────────────────────────────

/**
 * The fields this slice adds to the player profile.
 * Extend your game profile with this: `type GameProfile = BasePlayerProfile & InventorySliceData`
 */
export interface InventorySliceData {
	/** Full inventory state: loadout (category-keyed slot map) + backpack + learned abilities. */
	inventory: UnifiedInventorySnapshot;

	/** Schema version for the inventory slice. Used for per-slice migrations. */
	inventoryVersion: number;
}

// ── Slice Definition ────────────────────────────────────────────────────────

/**
 * Persistence slice for the slotable-items inventory system.
 *
 * @example
 * ```ts
 * import { composeProfile, DEFAULT_PROFILE_TEMPLATE } from "@trembus/persistent-data";
 * import { INVENTORY_PERSISTENCE_SLICE, InventorySliceData } from "@trembus/slotable-items";
 *
 * type GameProfile = BasePlayerProfile & InventorySliceData;
 * const { template, onLoad } = composeProfile<GameProfile>(
 *   DEFAULT_PROFILE_TEMPLATE as GameProfile,
 *   [INVENTORY_PERSISTENCE_SLICE],
 * );
 * ```
 */
export const INVENTORY_PERSISTENCE_SLICE: PersistenceSlice<InventorySliceData> = {
	sliceKey: "inventory",
	versionKey: "inventoryVersion",
	// VERSION DISCIPLINE: bump ONLY when a *persisted* shape changes. v1.0 adds registries,
	// a reference engine, and modifier projection — all runtime config or static catalog,
	// none of which touches the persisted `inventory` snapshot — so this stays at 1 with an
	// empty migrations map. When a real instance-shape change lands, bump here and add a
	// migration that runs `reviveInventoryInstances` (below) over loadout + backpack.
	currentVersion: 1,
	template: {
		inventory: DEFAULT_UNIFIED_INVENTORY,
		inventoryVersion: 1,
	},
	migrations: new Map(),
};

/**
 * Normalize every persisted instance through its kind's `reviveInstance` hook (identity by
 * default). Dormant scaffold — wire it into a migration when a future schema change needs
 * per-kind normalization. Mutates the snapshot in place; safe to call after a profile load.
 */
export function reviveInventoryInstances(snapshot: UnifiedInventorySnapshot): void {
	for (const [, bucket] of pairs(snapshot.loadout)) {
		for (const [slot, item] of pairs(bucket)) {
			if (item === undefined) continue;
			const kind = getKindForCategory(item.slotCategory);
			if (kind !== undefined && kind.reviveInstance !== undefined) {
				bucket[slot as string] = kind.reviveInstance(item);
			}
		}
	}
}
