// ─── MountSpawner — plain class, summon/mount/dismount/dismiss ──────────────
//
// Lifecycle:
//   summon  → spawn rig, attach seat, fire mountSummoned
//   mount   → sit player in seat, hand off network ownership, fire mountMounted
//   dismount → eject player, restore auto ownership, fire mountDismounted
//   dismiss → destroy rig, fire mountDismissed
// ─────────────────────────────────────────────────────────────────────────────

import { CollectionService, Workspace } from "@rbxts/services";
import { Logger } from "@trembus/logger";
import type { RigSpawner } from "@trembus/rig-spawner";
import { SpawnedMountMeta } from "./attributes";
import type { PetMountCatalog } from "./catalog";
import { LOG_TAG, MOUNT_TAG } from "./constants";
import { attachSeat, ejectSeat, type SeatBinding } from "./mount-seat";
import { PetMountSignals } from "./signals";
import type { MountInstance, SpawnedMount, SpawnerOptions } from "./types";

const logger = Logger.create(LOG_TAG);

interface ActiveBinding {
	readonly spawned: SpawnedMount;
	readonly seatBinding: SeatBinding;
}

export class MountSpawner {
	private active = new Map<Player, ActiveBinding>();

	constructor(
		private readonly catalog: PetMountCatalog,
		private readonly rigSpawner: RigSpawner,
		private readonly options: SpawnerOptions = {},
	) {}

	/**
	 * Spawn the mount rig and attach the seat. Does NOT auto-mount the player;
	 * call `mount(owner)` after summon to seat them.
	 */
	summon(owner: Player, instance: MountInstance, atCFrame?: CFrame): SpawnedMount | undefined {
		if (instance.ownerUserId !== owner.UserId) {
			logger.warn(`summon: instance ${instance.guid} not owned by ${owner.Name}; refusing`);
			return undefined;
		}
		const def = this.catalog.getMount(instance.catalogId);
		if (!def) {
			logger.warn(`summon: no MountDefinition for "${instance.catalogId}"`);
			return undefined;
		}

		// One active mount per owner.
		this.dismiss(owner);

		const position = atCFrame?.Position ?? this.resolveSpawnPosition(owner);
		const model = this.rigSpawner.spawnRig(def.rigId, position, {
			parent: this.options.parent ?? Workspace,
			spawnTag: this.options.tag ?? MOUNT_TAG,
		});
		if (!model) {
			logger.warn(`summon: rigSpawner returned no model for rigId "${def.rigId}"`);
			return undefined;
		}

		const humanoid = model.FindFirstChildWhichIsA("Humanoid");
		const rootPart = model.FindFirstChild("HumanoidRootPart");
		if (!humanoid || !rootPart || !rootPart.IsA("BasePart")) {
			logger.warn(`summon: mount rig "${def.rigId}" missing Humanoid/HumanoidRootPart`);
			model.Destroy();
			return undefined;
		}

		CollectionService.AddTag(model, MOUNT_TAG);
		SpawnedMountMeta.write(model, instance);

		const seatBinding = attachSeat(model, def.seatOffset, def.baseWalkSpeed, owner.UserId);

		// Wire seat events to module-level signals.
		seatBinding.mounted.Connect((player) => {
			const spawnedMount = this.active.get(player)?.spawned;
			if (spawnedMount) {
				PetMountSignals.mountMounted.Fire(player, spawnedMount);
			}
		});
		seatBinding.dismounted.Connect((player) => {
			PetMountSignals.mountDismounted.Fire(player, instance);
		});

		const spawned: SpawnedMount = {
			model,
			instance,
			humanoid,
			humanoidRootPart: rootPart,
			seat: seatBinding.seat,
		};
		this.active.set(owner, { spawned, seatBinding });

		PetMountSignals.mountSummoned.Fire(owner, spawned);
		logger.info(`Summoned mount "${def.displayName}" (${instance.guid}) for ${owner.Name}`);
		return spawned;
	}

	/** Sit the owner in the mount's seat (transfers network ownership). */
	mount(owner: Player): boolean {
		const binding = this.active.get(owner);
		if (!binding) {
			logger.warn(`mount: no active mount for ${owner.Name}`);
			return false;
		}
		const character = owner.Character;
		if (!character) {
			logger.warn(`mount: ${owner.Name} has no character`);
			return false;
		}
		const humanoid = character.FindFirstChildWhichIsA("Humanoid");
		if (!humanoid) {
			logger.warn(`mount: ${owner.Name} character has no Humanoid`);
			return false;
		}
		binding.seatBinding.seat.Sit(humanoid);
		return true;
	}

	/** Force the owner out of the mount seat. */
	dismount(owner: Player): boolean {
		const binding = this.active.get(owner);
		if (!binding) return false;
		return ejectSeat(binding.seatBinding.seat);
	}

	/** Despawn the mount entirely (eject first if occupied). */
	dismiss(owner: Player): void {
		const binding = this.active.get(owner);
		if (!binding) return;
		this.active.delete(owner);
		ejectSeat(binding.seatBinding.seat);
		binding.seatBinding.destroy();
		binding.spawned.model.Destroy();
		PetMountSignals.mountDismissed.Fire(owner, binding.spawned.instance);
		logger.info(`Dismissed mount ${binding.spawned.instance.guid} for ${owner.Name}`);
	}

	dismissAll(): void {
		const owners: Player[] = [];
		this.active.forEach((_, owner) => owners.push(owner));
		owners.forEach((owner) => this.dismiss(owner));
	}

	getActive(owner: Player): SpawnedMount | undefined {
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
				return root.Position.add(new Vector3(0, 0, -4));
			}
		}
		return new Vector3(0, 10, 0);
	}
}
