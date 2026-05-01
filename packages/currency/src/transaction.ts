// ─── Currency: Pure Transaction Helpers ───────────────────────────────────────
//
// All functions are immutable — they return new balance records rather than
// mutating input. Use these directly for functional composition, or let the
// Wallet class wrap them for a stateful API.
// ──────────────────────────────────────────────────────────────────────────────

import type {
	CurrencyBalances,
	CurrencyDefinition,
	CurrencyKey,
	TransactionResult,
} from "./types";

// ── Validation ──────────────────────────────────────────────────────────────

function invalidAmount(balance: number): TransactionResult {
	return { ok: false, balance, delta: 0, reason: "invalid-amount" };
}

/** Reject NaN, negative, and non-finite amounts. Also rejects fractions when integerOnly. */
function validateAmount(amount: number, def: CurrencyDefinition): boolean {
	if (amount !== amount) return false; // NaN
	if (amount < 0) return false;
	if (amount >= math.huge) return false;
	if (def.integerOnly && math.floor(amount) !== amount) return false;
	return true;
}

// ── Accessors ───────────────────────────────────────────────────────────────

/** Read the balance for a currency key. Returns 0 if the key is not present. */
export function getBalance(balances: CurrencyBalances, key: CurrencyKey): number {
	return balances[key] ?? 0;
}

/** True if the balance covers the requested amount. */
export function canAfford(
	balances: CurrencyBalances,
	key: CurrencyKey,
	amount: number,
): boolean {
	return getBalance(balances, key) >= amount;
}

// ── Mutations (Immutable) ───────────────────────────────────────────────────

/**
 * Attempt to deduct an amount from the balance for `def.key`.
 * Returns the next balances record and a result describing success/failure.
 * On failure, balances is returned unchanged.
 */
export function debit(
	balances: CurrencyBalances,
	def: CurrencyDefinition,
	amount: number,
): { balances: CurrencyBalances; result: TransactionResult } {
	const current = getBalance(balances, def.key);

	if (!validateAmount(amount, def)) {
		return { balances, result: invalidAmount(current) };
	}

	if (amount === 0) {
		return { balances, result: { ok: true, balance: current, delta: 0 } };
	}

	if (current - amount < def.min) {
		return {
			balances,
			result: { ok: false, balance: current, delta: 0, reason: "insufficient" },
		};
	}

	const newBalance = current - amount;
	return {
		balances: { ...balances, [def.key]: newBalance },
		result: { ok: true, balance: newBalance, delta: -amount },
	};
}

/**
 * Attempt to add an amount to the balance for `def.key`.
 * If `def.max` is set and the credit would exceed it:
 *   - If already at cap: returns { ok: false, reason: "cap" }
 *   - Otherwise: partially credits up to the cap (delta < amount)
 */
export function credit(
	balances: CurrencyBalances,
	def: CurrencyDefinition,
	amount: number,
): { balances: CurrencyBalances; result: TransactionResult } {
	const current = getBalance(balances, def.key);

	if (!validateAmount(amount, def)) {
		return { balances, result: invalidAmount(current) };
	}

	if (amount === 0) {
		return { balances, result: { ok: true, balance: current, delta: 0 } };
	}

	let newBalance = current + amount;
	let applied = amount;

	if (def.max !== undefined && newBalance > def.max) {
		if (current >= def.max) {
			return {
				balances,
				result: { ok: false, balance: current, delta: 0, reason: "cap" },
			};
		}
		applied = def.max - current;
		newBalance = def.max;
	}

	return {
		balances: { ...balances, [def.key]: newBalance },
		result: { ok: true, balance: newBalance, delta: applied },
	};
}

/**
 * Move an amount from one balance record to another.
 * Useful for player-to-player trades or moving funds between accounts.
 * If the debit fails, nothing is transferred.
 * If the credit hits a cap, the transfer still completes but with a partial delta.
 */
export function transfer(
	from: CurrencyBalances,
	to: CurrencyBalances,
	def: CurrencyDefinition,
	amount: number,
): {
	from: CurrencyBalances;
	to: CurrencyBalances;
	result: TransactionResult;
} {
	const debitOut = debit(from, def, amount);
	if (!debitOut.result.ok) {
		return { from, to, result: debitOut.result };
	}

	const creditIn = credit(to, def, amount);
	if (!creditIn.result.ok) {
		// Credit failed (e.g. receiver at cap) — don't apply the debit either
		return { from, to, result: creditIn.result };
	}

	return {
		from: debitOut.balances,
		to: creditIn.balances,
		result: {
			ok: true,
			balance: debitOut.result.balance,
			delta: creditIn.result.delta,
		},
	};
}
