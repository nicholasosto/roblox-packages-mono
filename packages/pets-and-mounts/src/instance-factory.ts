// ─── Instance factories — pure functions that mint owned-item records ────────

import { HttpService } from "@rbxts/services";
import type { GrantOptions, MountInstance, PetInstance } from "./types";

function newGuid(): string {
	return HttpService.GenerateGUID(false);
}

/** Mint a PetInstance for a player. Pure; no side effects. */
export function createPetInstance(
	catalogId: string,
	ownerUserId: number,
	options?: GrantOptions,
): PetInstance {
	return {
		guid: options?.guid ?? newGuid(),
		catalogId,
		ownerUserId,
		acquiredAt: options?.acquiredAt ?? os.time(),
		nickname: options?.nickname,
	};
}

/** Mint a MountInstance for a player. Pure; no side effects. */
export function createMountInstance(
	catalogId: string,
	ownerUserId: number,
	options?: GrantOptions,
): MountInstance {
	return {
		guid: options?.guid ?? newGuid(),
		catalogId,
		ownerUserId,
		acquiredAt: options?.acquiredAt ?? os.time(),
		nickname: options?.nickname,
	};
}
