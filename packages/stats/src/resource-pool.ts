// ─── Stats: Resource Pool Utilities ───────────────────────────────────────────
import type { DerivedStats, ResourcePoolState } from "./types";

// ── ResourcePool ────────────────────────────────────────────────────────────

/**
 * A single resource pool with current/max values and per-second regeneration.
 * Games wire this into RunService.Heartbeat via `tick(dt)`.
 *
 * NOT a Flamework service — games wrap it in their own service layer.
 */
export class ResourcePool {
	private _current: number;
	private _max: number;
	private _regenPerSecond: number;

	constructor(max: number, regenPerSecond: number, startFull = true) {
		this._max = math.max(0, max);
		this._regenPerSecond = math.max(0, regenPerSecond);
		this._current = startFull ? this._max : 0;
	}

	// ── Accessors ────────────────────────────────────────────────────────

	getCurrent(): number {
		return this._current;
	}

	getMax(): number {
		return this._max;
	}

	getRegenPerSecond(): number {
		return this._regenPerSecond;
	}

	// ── Queries ──────────────────────────────────────────────────────────

	isFull(): boolean {
		return this._current >= this._max;
	}

	isEmpty(): boolean {
		return this._current <= 0;
	}

	/** Returns current as a fraction of max (0..1). Returns 0 if max is 0. */
	percent(): number {
		if (this._max <= 0) return 0;
		return this._current / this._max;
	}

	/** Read-only snapshot for networking/UI. */
	snapshot(): ResourcePoolState {
		return {
			current: this._current,
			max: this._max,
			regenPerSecond: this._regenPerSecond,
		};
	}

	// ── Mutations ────────────────────────────────────────────────────────

	/** Apply regen over deltaTime seconds. Clamps to max. */
	tick(dt: number): void {
		if (this._regenPerSecond <= 0 || this.isFull()) return;
		this._current = math.min(this._max, this._current + this._regenPerSecond * dt);
	}

	/**
	 * Spend an amount from the pool. Returns actual amount spent.
	 * If the pool doesn't have enough, spends what's available (partial spend).
	 */
	spend(amount: number): number {
		if (amount <= 0) return 0;
		const actual = math.min(amount, this._current);
		this._current -= actual;
		return actual;
	}

	/**
	 * Restore an amount to the pool. Returns actual amount restored.
	 * Clamps to max.
	 */
	restore(amount: number): number {
		if (amount <= 0) return 0;
		const headroom = this._max - this._current;
		const actual = math.min(amount, headroom);
		this._current += actual;
		return actual;
	}

	/** Set current to max. */
	fill(): void {
		this._current = this._max;
	}

	/** Set current to 0. */
	drain(): void {
		this._current = 0;
	}

	/** Update max value. Clamps current to new max if it exceeds it. */
	setMax(newMax: number): void {
		this._max = math.max(0, newMax);
		this._current = math.min(this._current, this._max);
	}

	/** Update regen rate. */
	setRegenRate(rate: number): void {
		this._regenPerSecond = math.max(0, rate);
	}

	/** Set current value directly. Clamps to [0, max]. */
	setCurrent(value: number): void {
		this._current = math.clamp(value, 0, this._max);
	}
}

// ── ResourcePoolSet ─────────────────────────────────────────────────────────

/**
 * Manages the standard health/mana/stamina trio.
 * Reads max and regen values from DerivedStats.
 */
export class ResourcePoolSet {
	readonly health: ResourcePool;
	readonly mana: ResourcePool;
	readonly stamina: ResourcePool;

	constructor(stats: DerivedStats) {
		this.health = new ResourcePool(stats.maxHealth, stats.healthRegen);
		this.mana = new ResourcePool(stats.maxMana, stats.manaRegen);
		this.stamina = new ResourcePool(stats.maxStamina, stats.staminaRegen);
	}

	/**
	 * Recalculate max and regen from updated derived stats.
	 * Call this after equipment changes, buff application/removal, or level-up.
	 * Current values are clamped to the new max (not reset).
	 */
	updateFromStats(stats: DerivedStats): void {
		this.health.setMax(stats.maxHealth);
		this.health.setRegenRate(stats.healthRegen);

		this.mana.setMax(stats.maxMana);
		this.mana.setRegenRate(stats.manaRegen);

		this.stamina.setMax(stats.maxStamina);
		this.stamina.setRegenRate(stats.staminaRegen);
	}

	/** Tick all three pools. Wire into RunService.Heartbeat. */
	tickAll(dt: number): void {
		this.health.tick(dt);
		this.mana.tick(dt);
		this.stamina.tick(dt);
	}

	/** Fill all pools to max. */
	fillAll(): void {
		this.health.fill();
		this.mana.fill();
		this.stamina.fill();
	}
}
