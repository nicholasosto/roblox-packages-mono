// ─── Currency: Wallet Runtime Container ───────────────────────────────────────
//
// Mutable container wrapping a CurrencyBalances record. Enforces CurrencyDefinitions
// on every mutation and emits change callbacks for UI binding.
//
// NOT a Flamework service — games wrap this in their own service layer and
// wire persistence via @trembus/persistent-data's CURRENCY_PERSISTENCE_SLICE.
// ──────────────────────────────────────────────────────────────────────────────

import type {
	CurrencyBalances,
	CurrencyChangeHandler,
	CurrencyDefinition,
	CurrencyKey,
	TransactionResult,
} from "./types";
import { canAfford, credit, debit, getBalance } from "./transaction";

export class Wallet {
	private balances: CurrencyBalances;
	private readonly definitions: Map<CurrencyKey, CurrencyDefinition>;
	private readonly changeHandlers: Set<CurrencyChangeHandler>;

	constructor(
		definitions: ReadonlyArray<CurrencyDefinition>,
		startingBalances?: CurrencyBalances,
	) {
		this.definitions = new Map();
		for (const def of definitions) {
			this.definitions.set(def.key, def);
		}
		this.balances = { ...(startingBalances ?? {}) };
		this.changeHandlers = new Set();
	}

	// ── Accessors ────────────────────────────────────────────────────────

	getBalance(key: CurrencyKey): number {
		return getBalance(this.balances, key);
	}

	getDefinition(key: CurrencyKey): CurrencyDefinition | undefined {
		return this.definitions.get(key);
	}

	/** Read-only snapshot of all balances. Safe to pass to UI / networking. */
	snapshot(): CurrencyBalances {
		return { ...this.balances };
	}

	canAfford(key: CurrencyKey, amount: number): boolean {
		return canAfford(this.balances, key, amount);
	}

	// ── Mutations ────────────────────────────────────────────────────────

	credit(key: CurrencyKey, amount: number): TransactionResult {
		const def = this.definitions.get(key);
		if (def === undefined) {
			return { ok: false, balance: 0, delta: 0, reason: "unknown-currency" };
		}

		const outcome = credit(this.balances, def, amount);
		if (outcome.result.ok && outcome.result.delta !== 0) {
			this.balances = outcome.balances;
			this.emitChange(key, outcome.result.balance, outcome.result.delta);
		}
		return outcome.result;
	}

	debit(key: CurrencyKey, amount: number): TransactionResult {
		const def = this.definitions.get(key);
		if (def === undefined) {
			return { ok: false, balance: 0, delta: 0, reason: "unknown-currency" };
		}

		const outcome = debit(this.balances, def, amount);
		if (outcome.result.ok && outcome.result.delta !== 0) {
			this.balances = outcome.balances;
			this.emitChange(key, outcome.result.balance, outcome.result.delta);
		}
		return outcome.result;
	}

	/**
	 * Set a balance directly, clamped to the currency's [min, max].
	 * Use this for hydrating from persistence or admin overrides.
	 * Emits a change event if the clamped value differs from the previous balance.
	 */
	setBalance(key: CurrencyKey, amount: number): TransactionResult {
		const def = this.definitions.get(key);
		if (def === undefined) {
			return { ok: false, balance: 0, delta: 0, reason: "unknown-currency" };
		}

		const bounded =
			def.max !== undefined ? math.min(def.max, amount) : amount;
		const clamped = math.max(def.min, bounded);
		const previous = this.getBalance(key);
		const delta = clamped - previous;

		this.balances = { ...this.balances, [def.key]: clamped };
		if (delta !== 0) {
			this.emitChange(key, clamped, delta);
		}
		return { ok: true, balance: clamped, delta };
	}

	/**
	 * Hydrate balances from a record. Only currencies registered on this wallet
	 * are loaded; unknown keys in the record are ignored.
	 * Fires onChange for each currency whose value changed.
	 */
	load(balances: CurrencyBalances): void {
		for (const [key] of this.definitions) {
			const amount = balances[key];
			if (amount !== undefined) {
				this.setBalance(key, amount);
			}
		}
	}

	// ── Registration ─────────────────────────────────────────────────────

	/** Register an additional currency definition at runtime. */
	registerCurrency(def: CurrencyDefinition): void {
		this.definitions.set(def.key, def);
	}

	// ── Change Handlers ──────────────────────────────────────────────────

	/**
	 * Attach a change handler. Returns a detach function.
	 *
	 * @example
	 * ```ts
	 * const unsub = wallet.onChange((key, balance, delta) => print(key, balance));
	 * // later...
	 * unsub();
	 * ```
	 */
	onChange(handler: CurrencyChangeHandler): () => void {
		this.changeHandlers.add(handler);
		return () => {
			this.changeHandlers.delete(handler);
		};
	}

	private emitChange(key: CurrencyKey, newBalance: number, delta: number): void {
		for (const handler of this.changeHandlers) {
			handler(key, newBalance, delta);
		}
	}
}
