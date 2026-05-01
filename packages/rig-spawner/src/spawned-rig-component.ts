import { DEFAULT_SPAWN_TAG } from "./constants";

/**
 * Helper to read spawn metadata from a rig model's attributes.
 * This is a plain utility — not a Flamework component.
 * Consuming games can create their own @Component if they want lifecycle hooks.
 */
export namespace SpawnedRigMeta {
	export function getRigId(model: Model): string | undefined {
		return model.GetAttribute("rigId") as string | undefined;
	}

	export function getFaction(model: Model): string | undefined {
		return model.GetAttribute("faction") as string | undefined;
	}

	export function getSpawnPosition(model: Model): Vector3 | undefined {
		const x = model.GetAttribute("spawnX") as number | undefined;
		const y = model.GetAttribute("spawnY") as number | undefined;
		const z = model.GetAttribute("spawnZ") as number | undefined;
		if (x !== undefined && y !== undefined && z !== undefined) {
			return new Vector3(x, y, z);
		}
		return undefined;
	}

	export function getSpawnTime(model: Model): number | undefined {
		return model.GetAttribute("spawnTime") as number | undefined;
	}

	export function getAge(model: Model): number | undefined {
		const spawnTime = getSpawnTime(model);
		return spawnTime !== undefined ? os.clock() - spawnTime : undefined;
	}

	export function isSpawnedRig(model: Instance): boolean {
		return model.IsA("Model") && model.HasTag(DEFAULT_SPAWN_TAG);
	}
}
