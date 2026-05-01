// ─── Slotable Items: Persistence Slice ────────────────────────────────────────
//
// Declares the data contract for persisting inventory data via @trembus/persistent-data.
// Games compose this slice into their profile: `type GameProfile = BasePlayerProfile & InventorySliceData`
//
// The PersistenceSlice type is imported as type-only — no runtime dependency on persistent-data.
// ──────────────────────────────────────────────────────────────────────────────

import type { PersistenceSlice } from "@trembus/persistent-data";
import { DEFAULT_UNIFIED_INVENTORY } from "./inventory";
import type { UnifiedInventorySnapshot } from "./inventory";

// ── Slice Data Shape ────────────────────────────────────────────────────────

/**
 * The fields this slice adds to the player profile.
 * Extend your game profile with this: `type GameProfile = BasePlayerProfile & InventorySliceData`
 */
export interface InventorySliceData {
	/** Full inventory state: loadout (equipment, accessories, soul gems, abilities, consumables) + backpack + learned abilities. */
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
	currentVersion: 1,
	template: {
		inventory: DEFAULT_UNIFIED_INVENTORY,
		inventoryVersion: 1,
	},
	migrations: new Map(),
	// Future migrations go here:
	// migrations: new Map([
	//   [2, (data) => { /* add mount loadout */ return data; }],
	// ]),
};
