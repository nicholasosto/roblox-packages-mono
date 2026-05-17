import type { PassiveEffect } from "@trembus/status-effects";

// ─── Definitions (registered at startup, never mutated) ──────────────────────

/**
 * Tuning for how a pet follows its owner.
 * All distances are in studs; responsiveness is the AlignPosition tuning value.
 */
export interface FollowConfig {
	/** Desired distance behind/beside the owner. */
	readonly followDistance: number;
	/** Local offset applied to the follow anchor (e.g. Vector3.new(2, 0, 4)). */
	readonly offset: Vector3;
	/** AlignPosition.MaxForce magnitude. Higher = snappier. */
	readonly maxForce: number;
	/** AlignPosition.Responsiveness. Higher = quicker convergence. */
	readonly responsiveness: number;
	/** If the pet drifts beyond this distance from the target, teleport to catch up. */
	readonly teleportDistance: number;
}

/**
 * Catalog entry for a pet — a follower companion.
 *
 * The `rigId` is resolved by `@trembus/rig-spawner`; `anims.*` strings are
 * resolved by `@trembus/animation-catalog`. Definitions are frozen on
 * register and never mutated thereafter.
 */
export interface PetDefinition {
	readonly catalogId: string;
	readonly displayName: string;
	readonly rigId: string;
	readonly anims: {
		readonly idle: string;
		readonly walk: string;
	};
	readonly followConfig?: FollowConfig;
	readonly passiveEffects?: readonly PassiveEffect[];
	readonly tags?: readonly string[];
}

/**
 * Catalog entry for a mount — a rideable creature/vehicle.
 *
 * Mounts use `VehicleSeat` for the ride interaction and require explicit
 * network-ownership handoff on mount/dismount (see `mount-seat.ts`).
 */
export interface MountDefinition {
	readonly catalogId: string;
	readonly displayName: string;
	readonly rigId: string;
	readonly anims: {
		readonly idle: string;
		readonly walk: string;
		readonly run: string;
	};
	/** Local CFrame of the VehicleSeat relative to the rig's pivot. */
	readonly seatOffset: Vector3;
	/** Humanoid.WalkSpeed applied to the rider while mounted. */
	readonly baseWalkSpeed: number;
	readonly baseJumpPower?: number;
	readonly passiveEffects?: readonly PassiveEffect[];
	readonly tags?: readonly string[];
}

// ─── Instances (per-player owned records, persisted) ─────────────────────────

export interface PetInstance {
	readonly guid: string;
	readonly catalogId: string;
	readonly ownerUserId: number;
	readonly acquiredAt: number;
	readonly nickname?: string;
}

export interface MountInstance {
	readonly guid: string;
	readonly catalogId: string;
	readonly ownerUserId: number;
	readonly acquiredAt: number;
	readonly nickname?: string;
}

// ─── Spawned-rig handles (returned from summon()) ────────────────────────────

export interface SpawnedPet {
	readonly model: Model;
	readonly instance: PetInstance;
	readonly humanoid: Humanoid;
	readonly humanoidRootPart: BasePart;
}

export interface SpawnedMount {
	readonly model: Model;
	readonly instance: MountInstance;
	readonly humanoid: Humanoid;
	readonly humanoidRootPart: BasePart;
	readonly seat: VehicleSeat;
}

// ─── Spawner options ─────────────────────────────────────────────────────────

export interface SpawnerOptions {
	/** Parent for spawned rigs. Default: Workspace. */
	readonly parent?: Instance;
	/** Override the default CollectionService tag applied to spawned rigs. */
	readonly tag?: string;
}

// ─── Grant / transaction inputs ──────────────────────────────────────────────

export interface GrantOptions {
	readonly nickname?: string;
	/** Override acquiredAt. Default: os.time() at call site. */
	readonly acquiredAt?: number;
	/** Override the generated GUID. Useful for tests or grants from server-authoritative IDs. */
	readonly guid?: string;
}

// ─── Transaction result discriminated union (matches @trembus/currency shape) ─

export type TransactionFailureReason =
	| "CatalogMissing"
	| "InstanceNotFound"
	| "OwnershipMismatch"
	| "AlreadyOwned"
	| "InvalidArgument";

export type GrantPetResult =
	| { readonly ok: true; readonly data: PetMountSliceData; readonly instance: PetInstance }
	| { readonly ok: false; readonly reason: TransactionFailureReason };

export type GrantMountResult =
	| { readonly ok: true; readonly data: PetMountSliceData; readonly instance: MountInstance }
	| { readonly ok: false; readonly reason: TransactionFailureReason };

export type RemoveResult =
	| { readonly ok: true; readonly data: PetMountSliceData }
	| { readonly ok: false; readonly reason: TransactionFailureReason };

export type SetActiveResult =
	| { readonly ok: true; readonly data: PetMountSliceData }
	| { readonly ok: false; readonly reason: TransactionFailureReason };

// ─── Persistence slice data shape ────────────────────────────────────────────

/**
 * Fields this package adds to the player profile.
 *
 * Extend your game profile with this:
 *   `type GameProfile = BasePlayerProfile & PetMountSliceData;`
 */
export interface PetMountSliceData {
	ownedPets: ReadonlyArray<PetInstance>;
	ownedMounts: ReadonlyArray<MountInstance>;
	activePetGuid?: string;
	activeMountGuid?: string;
	petMountVersion: number;
}
