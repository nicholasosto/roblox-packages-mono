// ─── Currency: Persistence Slice ──────────────────────────────────────────────
//
// Declares the data contract for persisting currency balances via
// @trembus/persistent-data. Games compose this slice into their profile:
//   `type GameProfile = BasePlayerProfile & CurrencySliceData`
//
// PersistenceSlice is imported as type-only — no runtime dependency on
// persistent-data. The package compiles without it installed.
// ──────────────────────────────────────────────────────────────────────────────

import type { PersistenceSlice } from "@trembus/persistent-data";
import type { CurrencyBalances } from "./types";

// ── Slice Data Shape ────────────────────────────────────────────────────────

/**
 * The fields this slice adds to the player profile.
 * Extend your game profile with this:
 *   `type GameProfile = BasePlayerProfile & CurrencySliceData`
 *
 * Note: `currencies` intentionally aligns with the `currencies` field on
 * BasePlayerProfile — composing this slice doesn't widen the schema, it just
 * declares a per-slice migration version for the existing field.
 */
export interface CurrencySliceData {
	/** Keyed balances per currency. Keys are game-defined via CurrencyDefinitions. */
	currencies: CurrencyBalances;

	/** Schema version for the currency slice. Used for per-slice migrations. */
	currencyVersion: number;
}

// ── Default Template ────────────────────────────────────────────────────────

const DEFAULT_CURRENCY_SLICE: CurrencySliceData = {
	currencies: {},
	currencyVersion: 1,
};

// ── Slice Definition ────────────────────────────────────────────────────────

/**
 * Persistence slice for the currency system.
 *
 * @example
 * ```ts
 * import { composeProfile, DEFAULT_PROFILE_TEMPLATE, BasePlayerProfile } from "@trembus/persistent-data";
 * import { CURRENCY_PERSISTENCE_SLICE, CurrencySliceData } from "@trembus/currency";
 *
 * type GameProfile = BasePlayerProfile & CurrencySliceData;
 * const { template, onLoad } = composeProfile<GameProfile>(
 *   DEFAULT_PROFILE_TEMPLATE as GameProfile,
 *   [CURRENCY_PERSISTENCE_SLICE],
 * );
 * ```
 */
export const CURRENCY_PERSISTENCE_SLICE: PersistenceSlice<CurrencySliceData> = {
	sliceKey: "currency",
	versionKey: "currencyVersion",
	currentVersion: 1,
	template: DEFAULT_CURRENCY_SLICE,
	migrations: new Map(),
	// Future migrations go here:
	// migrations: new Map([
	//   [2, (data) => { data.currencies.gems ??= 0; return data; }],
	// ]),
};
