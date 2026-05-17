// ─── PetSpawner — plain class, summon/dismiss owned pets ────────────────────
//
// Consumer pattern (per house convention, matches @trembus/rig-spawner):
//
//   @Service()
//   export class MyPetService implements OnStart {
//     private spawner!: PetSpawner;
//     onStart() {
//       const catalog = new PetMountCatalog();
//       // catalog.registerPet(...) for each pet definition
//       this.spawner = new PetSpawner(catalog, this.rigSpawnerService.rigSpawner);
//     }
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { CollectionService, Workspace } from "@rbxts/services";
import { Logger } from "@trembus/logger";
import type { RigSpawner } from "@trembus/rig-spawner";
import { SpawnedPetMeta } from "./attributes";
import type { PetMountCatalog } from "./catalog";
import { DEFAULT_FOLLOW_CONFIG, LOG_TAG, PET_TAG } from "./constants";
import { attachFollow, type FollowBinding } from "./follow-behavior";
import { PetMountSignals } from "./signals";
import type { PetInstance, SpawnedPet, SpawnerOptions } from "./types";

const logger = Logger.create(LOG_TAG);

interface ActiveBinding {
	readonly spawned: SpawnedPet;
	readonly follow: FollowBinding;
}

export class PetSpawner {
	private active = new Map<Player, ActiveBinding>();

	constructor(
		private readonly catalog: PetMountCatalog,
		private readonly rigSpawner: RigSpawner,
		private readonly options: SpawnerOptions = {},
	) {}

	/**
	 * Summon the player's pet. If the player already has an active pet, the
	 * previous one is dismissed first.
	 */
	summon(owner: Player, instance: PetInstance): SpawnedPet | undefined {
		if (instance.ownerUserId !== owner.UserId) {
			logger.warn(`summon: instance ${instance.guid} not owned by ${owner.Name}; refusing`);
			return undefined;
		}
		const def = this.catalog.getPet(instance.catalogId);
		if (!def) {
			logger.warn(`summon: no PetDefinition for "${instance.catalogId}"`);
			return undefined;
		}

		// One active pet per owner.
		this.dismiss(owner);

		const spawnPos = this.resolveSpawnPosition(owner);
		const model = this.rigSpawner.spawnRig(def.rigId, spawnPos, {
			parent: this.options.parent ?? Workspace,
			spawnTag: this.options.tag ?? PET_TAG,
		});
		if (!model) {
			logger.warn(`summon: rigSpawner returned no model for rigId "${def.rigId}"`);
			return undefined;
		}

		const humanoid = model.FindFirstChildWhichIsA("Humanoid");
		const rootPart = model.FindFirstChild("HumanoidRootPart");
		if (!humanoid || !rootPart || !rootPart.IsA("BasePart")) {
			logger.warn(`summon: rig "${def.rigId}" missing Humanoid/HumanoidRootPart`);
			model.Destroy();
			return undefined;
		}

		CollectionService.AddTag(model, PET_TAG);
		SpawnedPetMeta.write(model, instance);

		const followConfig = def.followConfig ?? DEFAULT_FOLLOW_CONFIG;
		const follow = attachFollow(model, rootPart, owner, followConfig);

		const spawned: SpawnedPet = { model, instance, humanoid, humanoidRootPart: rootPart };
		this.active.set(owner, { spawned, follow });

		PetMountSignals.petSummoned.Fire(owner, spawned);
		logger.info(`Summoned pet "${def.displayName}" (${instance.guid}) for ${owner.Name}`);
		return spawned;
	}

	/** Dismiss the player's active pet. No-op if none. */
	dismiss(owner: Player): void {
		const binding = this.active.get(owner);
		if (!binding) return;
		this.active.delete(owner);
		binding.follow.destroy();
		binding.spawned.model.Destroy();
		PetMountSignals.petDismissed.Fire(owner, binding.spawned.instance);
		logger.info(`Dismissed pet ${binding.spawned.instance.guid} for ${owner.Name}`);
	}

	/** Dismiss all currently spawned pets. */
	dismissAll(): void {
		const owners: Player[] = [];
		this.active.forEach((_, owner) => owners.push(owner));
		owners.forEach((owner) => this.dismiss(owner));
	}

	getActive(owner: Player): SpawnedPet | undefined {
		return this.active.get(owner)?.spawned;
	}

	getActiveCount(): number {
		return this.active.size();
	}

	private resolveSpawnPosition(owner: Player): Vector3 {
		const character = owner.Character;
		if (character) {
			const root = character.FindFirstChild("HumanoidRootPart");
			if (root && root.IsA("BasePart")) {
				return root.Position;
			}
		}
		return new Vector3(0, 10, 0);
	}
}
