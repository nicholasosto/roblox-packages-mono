// ─── Spawned-rig metadata helpers ────────────────────────────────────────────
//
// Read/write per-instance metadata via Roblox Attributes — replicated for
// free to all clients. Mirrors `SpawnedRigMeta` from @trembus/rig-spawner.
// ─────────────────────────────────────────────────────────────────────────────

import { Workspace } from "@rbxts/services";
import {
	ATTR_ACQUIRED_AT,
	ATTR_CATALOG_ID,
	ATTR_INSTANCE_GUID,
	ATTR_OWNER_USER_ID,
	ATTR_SPAWN_TIME,
	MOUNT_TAG,
	PET_TAG,
} from "./constants";
import type { MountInstance, PetInstance } from "./types";

interface AnyInstance {
	readonly guid: string;
	readonly catalogId: string;
	readonly ownerUserId: number;
	readonly acquiredAt: number;
}

function writeBaseAttributes(model: Model, inst: AnyInstance): void {
	model.SetAttribute(ATTR_INSTANCE_GUID, inst.guid);
	model.SetAttribute(ATTR_CATALOG_ID, inst.catalogId);
	model.SetAttribute(ATTR_OWNER_USER_ID, inst.ownerUserId);
	model.SetAttribute(ATTR_ACQUIRED_AT, inst.acquiredAt);
	model.SetAttribute(ATTR_SPAWN_TIME, Workspace.GetServerTimeNow());
}

function getNumberAttr(model: Model, key: string): number | undefined {
	return model.GetAttribute(key) as number | undefined;
}

function getStringAttr(model: Model, key: string): string | undefined {
	return model.GetAttribute(key) as string | undefined;
}

// ─── Pet metadata namespace ──────────────────────────────────────────────────

export namespace SpawnedPetMeta {
	export function write(model: Model, instance: PetInstance): void {
		writeBaseAttributes(model, instance);
	}

	export function getGuid(model: Model): string | undefined {
		return getStringAttr(model, ATTR_INSTANCE_GUID);
	}

	export function getCatalogId(model: Model): string | undefined {
		return getStringAttr(model, ATTR_CATALOG_ID);
	}

	export function getOwnerUserId(model: Model): number | undefined {
		return getNumberAttr(model, ATTR_OWNER_USER_ID);
	}

	export function getAcquiredAt(model: Model): number | undefined {
		return getNumberAttr(model, ATTR_ACQUIRED_AT);
	}

	export function isSpawnedPet(instance: Instance): boolean {
		return instance.IsA("Model") && instance.HasTag(PET_TAG);
	}
}

// ─── Mount metadata namespace ────────────────────────────────────────────────

export namespace SpawnedMountMeta {
	export function write(model: Model, instance: MountInstance): void {
		writeBaseAttributes(model, instance);
	}

	export function getGuid(model: Model): string | undefined {
		return getStringAttr(model, ATTR_INSTANCE_GUID);
	}

	export function getCatalogId(model: Model): string | undefined {
		return getStringAttr(model, ATTR_CATALOG_ID);
	}

	export function getOwnerUserId(model: Model): number | undefined {
		return getNumberAttr(model, ATTR_OWNER_USER_ID);
	}

	export function getAcquiredAt(model: Model): number | undefined {
		return getNumberAttr(model, ATTR_ACQUIRED_AT);
	}

	export function isSpawnedMount(instance: Instance): boolean {
		return instance.IsA("Model") && instance.HasTag(MOUNT_TAG);
	}
}
