// ─── @trembus/pets-and-mounts: Barrel Exports ───────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────
export type {
	FollowConfig,
	GrantMountResult,
	GrantOptions,
	GrantPetResult,
	MountDefinition,
	MountInstance,
	PetDefinition,
	PetInstance,
	PetMountSliceData,
	RemoveResult,
	SetActiveResult,
	SpawnedMount,
	SpawnedPet,
	SpawnerOptions,
	TransactionFailureReason,
} from "./types";

// ── Catalog (open registry) ──────────────────────────────────────────────────
export { PetMountCatalog } from "./catalog";

// ── Instance factories ───────────────────────────────────────────────────────
export { createMountInstance, createPetInstance } from "./instance-factory";

// ── Pure transactions ────────────────────────────────────────────────────────
export {
	findMount,
	findPet,
	getActiveMount,
	getActivePet,
	grantMount,
	grantPet,
	removeMount,
	removePet,
	setActiveMount,
	setActivePet,
} from "./transactions";

// ── Persistence slice ────────────────────────────────────────────────────────
export {
	DEFAULT_PETS_AND_MOUNTS_SLICE,
	PETS_AND_MOUNTS_PERSISTENCE_SLICE,
} from "./persistence";

// ── Spawners ─────────────────────────────────────────────────────────────────
export { PetSpawner } from "./pet-spawner";
export { MountSpawner } from "./mount-spawner";

// ── Behavior helpers (for advanced use / custom spawners) ────────────────────
export { attachFollow, type FollowBinding } from "./follow-behavior";
export { attachSeat, ejectSeat, type SeatBinding } from "./mount-seat";

// ── Spawned metadata namespaces ──────────────────────────────────────────────
export { SpawnedMountMeta, SpawnedPetMeta } from "./attributes";

// ── Signals ──────────────────────────────────────────────────────────────────
export { PetMountSignals } from "./signals";

// ── Validators ───────────────────────────────────────────────────────────────
export {
	isCatalogIdArg,
	isGuidOrUndefined,
	isMountDefinition,
	isMountInstance,
	isPetDefinition,
	isPetInstance,
} from "./validators";

// ── Constants ────────────────────────────────────────────────────────────────
export {
	ATTR_ACQUIRED_AT,
	ATTR_CATALOG_ID,
	ATTR_INSTANCE_GUID,
	ATTR_OWNER_USER_ID,
	ATTR_SPAWN_TIME,
	DEFAULT_FOLLOW_CONFIG,
	MOUNT_TAG,
	PETS_AND_MOUNTS_SLICE_KEY,
	PETS_AND_MOUNTS_SLICE_VERSION,
	PETS_AND_MOUNTS_VERSION_KEY,
	PET_TAG,
} from "./constants";
