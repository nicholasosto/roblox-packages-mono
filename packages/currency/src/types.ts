// ─── Currency: Core Type Definitions ──────────────────────────────────────────

// ── Currency Key ────────────────────────────────────────────────────────────

/**
 * Identifier for a currency. Open string — games define their own keys
 * (e.g. "coins", "gems", "shards", "xp-fragments").
 */
export type CurrencyKey = string;

// ── Currency Definition ─────────────────────────────────────────────────────

/**
 * Declarative metadata + constraints for a single currency.
 * Create with `defineCurrency()` for sensible defaults.
 */
export interface CurrencyDefinition {
	/** Unique identifier used as the record key. */
	readonly key: CurrencyKey;

	/** Human-readable name for UI display. */
	readonly displayName: string;

	/** Floor for this currency (typically 0). */
	readonly min: number;

	/** Optional cap — credits beyond this are clamped. Undefined = no cap. */
	readonly max?: number;

	/** When true, fractional amounts are rejected as invalid. */
	readonly integerOnly: boolean;
}

// ── Balances ─────────────────────────────────────────────────────────────────

/**
 * A map of currency keys to balances.
 * Matches the `currencies: Record<string, number>` shape on BasePlayerProfile.
 */
export type CurrencyBalances = Record<CurrencyKey, number>;

// ── Transaction Results ─────────────────────────────────────────────────────

export type TransactionFailureReason =
	| "insufficient"
	| "cap"
	| "invalid-amount"
	| "unknown-currency";

export interface TransactionResult {
	/** Whether the transaction was applied. */
	readonly ok: boolean;

	/** The resulting balance (or current balance if the transaction failed). */
	readonly balance: number;

	/** Actual delta applied. Negative for debits, positive for credits, 0 on failure. */
	readonly delta: number;

	/** Present when ok is false — explains why. */
	readonly reason?: TransactionFailureReason;
}

// ── Change Handlers ─────────────────────────────────────────────────────────

/**
 * Callback invoked when a Wallet balance changes.
 * @param key - The currency that changed.
 * @param newBalance - Balance after the change.
 * @param delta - Amount applied (negative for debits, positive for credits).
 */
export type CurrencyChangeHandler = (
	key: CurrencyKey,
	newBalance: number,
	delta: number,
) => void;
