// ─── Profile Composition: Merge Slices into a Complete Profile ────────────────
import type { BasePlayerProfile } from "./types";
import type { PersistenceSlice } from "./slice";

/**
 * Result of composing a base profile template with persistence slices.
 *
 * @template T - The fully-composed profile type (base + all slice data).
 */
export interface ComposedProfileConfig<T extends BasePlayerProfile> {
	/** Merged template with all slice defaults baked in. */
	readonly template: T;

	/**
	 * Runs per-slice migrations on loaded profile data.
	 * Call this after ProfileStore loads + reconciles the data.
	 * Each slice's migrations run independently based on its own version key.
	 */
	readonly onLoad: (data: T) => T;
}

/**
 * Compose a player profile from a base template and an array of persistence slices.
 *
 * Merges each slice's template fields into the base, and produces an `onLoad`
 * callback that runs per-slice migrations when a profile is loaded.
 *
 * @example
 * ```ts
 * type GameProfile = BasePlayerProfile & InventorySliceData;
 *
 * const { template, onLoad } = composeProfile<GameProfile>(
 *   { ...DEFAULT_PROFILE_TEMPLATE, questLog: new Map() } as GameProfile,
 *   [INVENTORY_PERSISTENCE_SLICE],
 * );
 *
 * const manager = new PersistentDataManager("GameData", template, { onLoad });
 * ```
 */
export function composeProfile<T extends BasePlayerProfile>(
	baseTemplate: T,
	slices: PersistenceSlice<object>[],
): ComposedProfileConfig<T> {
	// ── Merge slice templates into base ──────────────────────────────────────
	const merged = { ...baseTemplate };

	for (const slice of slices) {
		for (const [key, value] of pairs(slice.template as Record<string, unknown>)) {
			(merged as Record<string, unknown>)[key as string] = value;
		}
	}

	// ── Build per-slice migration runner ─────────────────────────────────────
	const frozenSlices = [...slices];

	const onLoad = (data: T): T => {
		let current = data;

		for (const slice of frozenSlices) {
			current = migrateSlice(current, slice);
		}

		return current;
	};

	return {
		template: merged,
		onLoad,
	};
}

/**
 * Run a single slice's migrations against the profile data.
 * Reads the slice's version key from the profile, then applies migrations
 * sequentially until the version matches `slice.currentVersion`.
 */
function migrateSlice<T extends BasePlayerProfile>(
	data: T,
	slice: PersistenceSlice<object>,
): T {
	const record = data as unknown as Record<string, unknown>;

	// Read the current version from the profile (default to 0 if missing)
	let dataVersion = (record[slice.versionKey] as number | undefined) ?? 0;

	if (dataVersion >= slice.currentVersion) {
		return data;
	}

	// Apply migrations sequentially
	while (dataVersion < slice.currentVersion) {
		const nextVersion = dataVersion + 1;
		const migrator = slice.migrations.get(nextVersion);

		if (migrator !== undefined) {
			// Extract slice-relevant data, run migration, merge back
			const sliceData = record as Record<string, unknown>;
			const migrated = migrator(sliceData);

			// Merge migrated fields back onto the profile
			for (const [key, value] of pairs(migrated as Record<string, unknown>)) {
				record[key as string] = value;
			}
		}

		dataVersion = nextVersion;
	}

	// Stamp the current version
	record[slice.versionKey] = slice.currentVersion;

	return data;
}
