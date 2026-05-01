// ─── Stats: Persistence Slice + Allocation Helpers ────────────────────────────
//
// Declares the data contract for persisting stat allocations via @trembus/persistent-data.
// Games compose this slice into their profile:
//   `type GameProfile = BasePlayerProfile & StatsSliceData`
//
// PersistenceSlice is imported as type-only — no runtime dependency on persistent-data.
// ──────────────────────────────────────────────────────────────────────────────

import type { PersistenceSlice } from "@trembus/persistent-data";
import type { PrimaryAttributes, PrimaryAttributeKey } from "./types";
import { PRIMARY_ATTRIBUTE_KEYS } from "./types";
import { DEFAULT_BASE_ATTRIBUTES } from "./defaults";

// ── Slice Data Shape ────────────────────────────────────────────────────────

/**
 * The fields this slice adds to the player profile.
 * Extend your game profile with this:
 *   `type GameProfile = BasePlayerProfile & StatsSliceData`
 */
export interface StatsSliceData {
	/** Player's invested attribute points. */
	baseAttributes: PrimaryAttributes;

	/** Points available to allocate (granted by game's leveling system). */
	unspentAttributePoints: number;

	/** Current player level — fed into derivation formulas. Set by the game. */
	level: number;

	/** Schema version for the stats slice. Used for per-slice migrations. */
	statsVersion: number;
}

// ── Default Template ────────────────────────────────────────────────────────

const DEFAULT_STATS_SLICE: StatsSliceData = {
	baseAttributes: { ...DEFAULT_BASE_ATTRIBUTES },
	unspentAttributePoints: 0,
	level: 1,
	statsVersion: 1,
};

// ── Slice Definition ────────────────────────────────────────────────────────

/**
 * Persistence slice for the stats system.
 *
 * @example
 * ```ts
 * import { composeProfile, DEFAULT_PROFILE_TEMPLATE } from "@trembus/persistent-data";
 * import { STATS_PERSISTENCE_SLICE, StatsSliceData } from "@trembus/stats";
 *
 * type GameProfile = BasePlayerProfile & StatsSliceData;
 * const { template, onLoad } = composeProfile<GameProfile>(
 *   DEFAULT_PROFILE_TEMPLATE as GameProfile,
 *   [STATS_PERSISTENCE_SLICE],
 * );
 * ```
 */
export const STATS_PERSISTENCE_SLICE: PersistenceSlice<StatsSliceData> = {
	sliceKey: "stats",
	versionKey: "statsVersion",
	currentVersion: 1,
	template: DEFAULT_STATS_SLICE,
	migrations: new Map(),
	// Future migrations go here:
	// migrations: new Map([
	//   [2, (data) => { data.baseAttributes.Luck ??= 5; return data; }],
	// ]),
};

// ── Allocation Helpers (Pure Functions) ──────────────────────────────────────

/**
 * Allocate one attribute point. Returns new state, or undefined if no points available.
 * Immutable — returns a new StatsSliceData, does not mutate the input.
 */
export function allocateAttributePoint(
	data: StatsSliceData,
	attribute: PrimaryAttributeKey,
): StatsSliceData | undefined {
	if (data.unspentAttributePoints <= 0) return undefined;

	const newAttributes = { ...data.baseAttributes };
	newAttributes[attribute] += 1;

	return {
		...data,
		baseAttributes: newAttributes,
		unspentAttributePoints: data.unspentAttributePoints - 1,
	};
}

/**
 * Reset all attributes to defaults and return all spent points to the unspent pool.
 * Immutable — returns a new StatsSliceData, does not mutate the input.
 */
export function respecAttributes(data: StatsSliceData): StatsSliceData {
	const spent = totalAllocatedPoints(data);

	return {
		...data,
		baseAttributes: { ...DEFAULT_BASE_ATTRIBUTES },
		unspentAttributePoints: data.unspentAttributePoints + spent,
	};
}

/**
 * Count total points the player has allocated above the default baseline.
 */
export function totalAllocatedPoints(data: StatsSliceData): number {
	let total = 0;

	for (const key of PRIMARY_ATTRIBUTE_KEYS) {
		const allocated = data.baseAttributes[key] - DEFAULT_BASE_ATTRIBUTES[key];
		if (allocated > 0) {
			total += allocated;
		}
	}

	return total;
}
