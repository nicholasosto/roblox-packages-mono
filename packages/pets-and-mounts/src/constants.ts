import type { FollowConfig } from "./types";

/** CollectionService tag applied to spawned pet models. */
export const PET_TAG = "PetsAndMounts.Pet";

/** CollectionService tag applied to spawned mount models. */
export const MOUNT_TAG = "PetsAndMounts.Mount";

/** Logger tag used by all internal logging. */
export const LOG_TAG = "pets-and-mounts";

/** Schema version for the persistence slice. Bump when changing PetMountSliceData. */
export const PETS_AND_MOUNTS_SLICE_VERSION = 1;

/** Slice key used by @trembus/persistent-data compose(). */
export const PETS_AND_MOUNTS_SLICE_KEY = "petMount";

/** Profile field name that tracks this slice's schema version. */
export const PETS_AND_MOUNTS_VERSION_KEY = "petMountVersion";

/** Attribute names written to spawned models. Mirrors SpawnedRigMeta convention. */
export const ATTR_OWNER_USER_ID = "ownerUserId";
export const ATTR_CATALOG_ID = "catalogId";
export const ATTR_INSTANCE_GUID = "instanceGuid";
export const ATTR_ACQUIRED_AT = "acquiredAt";
export const ATTR_SPAWN_TIME = "spawnTime";

/** Default tuning for pet follow behavior. */
export const DEFAULT_FOLLOW_CONFIG: FollowConfig = {
	followDistance: 6,
	offset: new Vector3(3, 0, 3),
	maxForce: 50_000,
	responsiveness: 25,
	teleportDistance: 80,
};
