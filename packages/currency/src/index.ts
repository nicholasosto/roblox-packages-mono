// ─── @trembus/currency — Public API ───────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────────────────────

export type {
	CurrencyKey,
	CurrencyDefinition,
	CurrencyBalances,
	CurrencyChangeHandler,
	TransactionResult,
	TransactionFailureReason,
} from "./types";

// ── Definition Helpers ──────────────────────────────────────────────────────

export { defineCurrency } from "./defaults";

// ── Pure Transactions ───────────────────────────────────────────────────────

export { getBalance, canAfford, debit, credit, transfer } from "./transaction";

// ── Wallet Class ────────────────────────────────────────────────────────────

export { Wallet } from "./wallet";

// ── Persistence ─────────────────────────────────────────────────────────────

export type { CurrencySliceData } from "./persistence";
export { CURRENCY_PERSISTENCE_SLICE } from "./persistence";
