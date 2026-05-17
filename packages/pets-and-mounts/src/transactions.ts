// ─── Pure transaction functions ──────────────────────────────────────────────
//
// All functions are immutable — they return new slice records rather than
// mutating input. Result shape mirrors @trembus/currency:
//   { ok: true, data, instance? } | { ok: false, reason }
// ─────────────────────────────────────────────────────────────────────────────

import { createMountInstance, createPetInstance } from "./instance-factory";
import type {
	GrantMountResult,
	GrantOptions,
	GrantPetResult,
	MountInstance,
	PetInstance,
	PetMountSliceData,
	RemoveResult,
	SetActiveResult,
} from "./types";

// ─── Grant ───────────────────────────────────────────────────────────────────

export function grantPet(
	data: PetMountSliceData,
	catalogId: string,
	ownerUserId: number,
	options?: GrantOptions,
): GrantPetResult {
	if (catalogId === "") {
		return { ok: false, reason: "InvalidArgument" };
	}
	const inst = createPetInstance(catalogId, ownerUserId, options);
	const nextData: PetMountSliceData = {
		...data,
		ownedPets: [...data.ownedPets, inst],
	};
	return { ok: true, data: nextData, instance: inst };
}

export function grantMount(
	data: PetMountSliceData,
	catalogId: string,
	ownerUserId: number,
	options?: GrantOptions,
): GrantMountResult {
	if (catalogId === "") {
		return { ok: false, reason: "InvalidArgument" };
	}
	const inst = createMountInstance(catalogId, ownerUserId, options);
	const nextData: PetMountSliceData = {
		...data,
		ownedMounts: [...data.ownedMounts, inst],
	};
	return { ok: true, data: nextData, instance: inst };
}

// ─── Remove ──────────────────────────────────────────────────────────────────

export function removePet(data: PetMountSliceData, guid: string): RemoveResult {
	const idx = data.ownedPets.findIndex((p) => p.guid === guid);
	if (idx === -1) {
		return { ok: false, reason: "InstanceNotFound" };
	}
	const nextPets = data.ownedPets.filter((p) => p.guid !== guid);
	// Clear active pet pointer if it referenced the removed instance.
	const nextActive = data.activePetGuid === guid ? undefined : data.activePetGuid;
	return {
		ok: true,
		data: { ...data, ownedPets: nextPets, activePetGuid: nextActive },
	};
}

export function removeMount(data: PetMountSliceData, guid: string): RemoveResult {
	const idx = data.ownedMounts.findIndex((m) => m.guid === guid);
	if (idx === -1) {
		return { ok: false, reason: "InstanceNotFound" };
	}
	const nextMounts = data.ownedMounts.filter((m) => m.guid !== guid);
	const nextActive = data.activeMountGuid === guid ? undefined : data.activeMountGuid;
	return {
		ok: true,
		data: { ...data, ownedMounts: nextMounts, activeMountGuid: nextActive },
	};
}

// ─── Set active ──────────────────────────────────────────────────────────────

export function setActivePet(
	data: PetMountSliceData,
	guid: string | undefined,
): SetActiveResult {
	if (guid !== undefined && data.ownedPets.findIndex((p) => p.guid === guid) === -1) {
		return { ok: false, reason: "InstanceNotFound" };
	}
	return { ok: true, data: { ...data, activePetGuid: guid } };
}

export function setActiveMount(
	data: PetMountSliceData,
	guid: string | undefined,
): SetActiveResult {
	if (guid !== undefined && data.ownedMounts.findIndex((m) => m.guid === guid) === -1) {
		return { ok: false, reason: "InstanceNotFound" };
	}
	return { ok: true, data: { ...data, activeMountGuid: guid } };
}

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function findPet(data: PetMountSliceData, guid: string): PetInstance | undefined {
	return data.ownedPets.find((p) => p.guid === guid);
}

export function findMount(data: PetMountSliceData, guid: string): MountInstance | undefined {
	return data.ownedMounts.find((m) => m.guid === guid);
}

export function getActivePet(data: PetMountSliceData): PetInstance | undefined {
	return data.activePetGuid !== undefined ? findPet(data, data.activePetGuid) : undefined;
}

export function getActiveMount(data: PetMountSliceData): MountInstance | undefined {
	return data.activeMountGuid !== undefined ? findMount(data, data.activeMountGuid) : undefined;
}
