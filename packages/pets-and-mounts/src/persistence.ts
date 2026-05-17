// ─── Pets & Mounts: Persistence Slice ────────────────────────────────────────
//
// Declares the data contract for persisting pet/mount ownership and active
// selection via @trembus/persistent-data. Mirrors the shape of
// `INVENTORY_PERSISTENCE_SLICE` (slotable-items) so games can compose this
// slice alongside the others uniformly.
//
// `PersistenceSlice` is a type-only import — no runtime dependency on
// persistent-data.
// ─────────────────────────────────────────────────────────────────────────────

import type { PersistenceSlice } from "@trembus/persistent-data";
import {
	PETS_AND_MOUNTS_SLICE_KEY,
	PETS_AND_MOUNTS_SLICE_VERSION,
	PETS_AND_MOUNTS_VERSION_KEY,
} from "./constants";
import type { PetMountSliceData } from "./types";

/** Default values merged into the player profile template on first load. */
export const DEFAULT_PETS_AND_MOUNTS_SLICE: PetMountSliceData = {
	ownedPets: [],
	ownedMounts: [],
	activePetGuid: undefined,
	activeMountGuid: undefined,
	petMountVersion: PETS_AND_MOUNTS_SLICE_VERSION,
};

/**
 * Persistence slice for `@trembus/pets-and-mounts`.
 *
 * @example
 * ```ts
 * import { composeProfile, DEFAULT_PROFILE_TEMPLATE } from "@trembus/persistent-data";
 * import { PETS_AND_MOUNTS_PERSISTENCE_SLICE, PetMountSliceData } from "@trembus/pets-and-mounts";
 *
 * type GameProfile = BasePlayerProfile & PetMountSliceData;
 * const { template, onLoad } = composeProfile<GameProfile>(
 *   DEFAULT_PROFILE_TEMPLATE as GameProfile,
 *   [PETS_AND_MOUNTS_PERSISTENCE_SLICE],
 * );
 * ```
 */
export const PETS_AND_MOUNTS_PERSISTENCE_SLICE: PersistenceSlice<PetMountSliceData> = {
	sliceKey: PETS_AND_MOUNTS_SLICE_KEY,
	versionKey: PETS_AND_MOUNTS_VERSION_KEY,
	currentVersion: PETS_AND_MOUNTS_SLICE_VERSION,
	template: DEFAULT_PETS_AND_MOUNTS_SLICE,
	migrations: new Map(),
	// Future migrations go here:
	// migrations: new Map([
	//   [2, (data) => { /* add field */ return data; }],
	// ]),
};
