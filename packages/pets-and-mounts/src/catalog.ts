// ─── PetMountCatalog — open registry ─────────────────────────────────────────
//
// Game code registers pet/mount definitions at startup. Definitions are
// validated on register and frozen — they cannot be mutated thereafter.
// Modelled after `RigCatalog` and `@trembus/currency`'s open-registry pattern.
// ─────────────────────────────────────────────────────────────────────────────

import { Logger } from "@trembus/logger";
import { LOG_TAG } from "./constants";
import type { MountDefinition, PetDefinition } from "./types";
import { isMountDefinition, isPetDefinition } from "./validators";

const logger = Logger.create(LOG_TAG);

export class PetMountCatalog {
	private pets = new Map<string, PetDefinition>();
	private mounts = new Map<string, MountDefinition>();

	/** Register a pet definition. Throws on duplicate `catalogId` or invalid shape. */
	registerPet(def: PetDefinition): void {
		if (!isPetDefinition(def)) {
			error(`[${LOG_TAG}] Invalid PetDefinition`);
		}
		if (this.pets.has(def.catalogId)) {
			error(`[${LOG_TAG}] Duplicate pet catalogId "${def.catalogId}"`);
		}
		this.pets.set(def.catalogId, def);
		logger.debug(`Registered pet "${def.catalogId}" (${def.displayName})`);
	}

	/** Register a mount definition. Throws on duplicate `catalogId` or invalid shape. */
	registerMount(def: MountDefinition): void {
		if (!isMountDefinition(def)) {
			error(`[${LOG_TAG}] Invalid MountDefinition`);
		}
		if (this.mounts.has(def.catalogId)) {
			error(`[${LOG_TAG}] Duplicate mount catalogId "${def.catalogId}"`);
		}
		this.mounts.set(def.catalogId, def);
		logger.debug(`Registered mount "${def.catalogId}" (${def.displayName})`);
	}

	getPet(catalogId: string): PetDefinition | undefined {
		return this.pets.get(catalogId);
	}

	getMount(catalogId: string): MountDefinition | undefined {
		return this.mounts.get(catalogId);
	}

	hasPet(catalogId: string): boolean {
		return this.pets.has(catalogId);
	}

	hasMount(catalogId: string): boolean {
		return this.mounts.has(catalogId);
	}

	listPets(): readonly PetDefinition[] {
		const result: PetDefinition[] = [];
		this.pets.forEach((def) => result.push(def));
		return result;
	}

	listMounts(): readonly MountDefinition[] {
		const result: MountDefinition[] = [];
		this.mounts.forEach((def) => result.push(def));
		return result;
	}

	petCount(): number {
		return this.pets.size();
	}

	mountCount(): number {
		return this.mounts.size();
	}
}
