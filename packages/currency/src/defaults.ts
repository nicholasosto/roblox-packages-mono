// ─── Currency: Definition Helpers ─────────────────────────────────────────────
//
// This package ships with NO default currencies. Games define their own via
// `defineCurrency()` — currency is pure infrastructure.
// ──────────────────────────────────────────────────────────────────────────────

import type { CurrencyDefinition, CurrencyKey } from "./types";

/**
 * Create a CurrencyDefinition with sensible defaults: integer-only, non-negative, no cap.
 *
 * @example
 * ```ts
 * const coins = defineCurrency("coins", "Coins");
 * const gems = defineCurrency("gems", "Gems", { max: 999_999 });
 * const dust = defineCurrency("dust", "Stardust", { integerOnly: false });
 * ```
 */
export function defineCurrency(
	key: CurrencyKey,
	displayName: string,
	overrides?: Partial<Omit<CurrencyDefinition, "key" | "displayName">>,
): CurrencyDefinition {
	return {
		key,
		displayName,
		min: overrides?.min ?? 0,
		max: overrides?.max,
		integerOnly: overrides?.integerOnly ?? true,
	};
}
