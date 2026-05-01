// ─── Persistence Slice: Composable Data Contracts ─────────────────────────────

/**
 * A persistence slice declares what a package needs saved in the player profile.
 *
 * Each package (slotable-items, audio, etc.) exports a slice constant
 * containing its data shape, default template, schema version, and migrations.
 * Games compose slices into a full profile via `composeProfile()`.
 *
 * @template TData - The data shape this slice adds to the profile.
 *                   Must be a flat record (fields merge directly onto the profile).
 */
export interface PersistenceSlice<TData extends object> {
	/** Human-readable identifier for this slice (e.g. "inventory", "audio"). */
	readonly sliceKey: string;

	/** Profile field name that tracks this slice's schema version (e.g. "inventoryVersion"). */
	readonly versionKey: string;

	/** Current schema version for this slice. Migrations run up to this number. */
	readonly currentVersion: number;

	/** Default values merged into the profile template. */
	readonly template: TData;

	/**
	 * Version-keyed migration functions.
	 * Key = target version, Value = transform from previous version.
	 * Example: Map([[2, (d) => { d.newField = "default"; return d; }]])
	 */
	readonly migrations: Map<number, (data: TData) => TData>;
}
