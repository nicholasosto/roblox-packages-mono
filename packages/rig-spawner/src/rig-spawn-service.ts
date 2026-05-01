import { CollectionService, ServerStorage, Workspace } from "@rbxts/services";
import { RigCatalog } from "./rig-catalog";
import { Faction, RigEntry, SpawnConfig } from "./types";
import { DEFAULT_RIG_PACKAGE_NAME, DEFAULT_SPAWN_TAG } from "./constants";

/**
 * Core rig spawning logic. This is a plain class (no Flamework decorators)
 * so it can be used from any context. Consuming games should wrap this
 * in their own Flamework @Service for DI integration.
 */
export class RigSpawner {
	private catalog = new RigCatalog();
	private spawnedRigs = new Map<Model, string>();

	/**
	 * Initialize by scanning the default Asset Package folder in ServerStorage.
	 * Call this from your Flamework service's onStart().
	 */
	initialize(): number {
		const rigPackage = ServerStorage.FindFirstChild(DEFAULT_RIG_PACKAGE_NAME);
		if (rigPackage) {
			const count = this.catalog.scanFolder(rigPackage);
			print(`[RigSpawner] Cataloged ${count} rigs from ${DEFAULT_RIG_PACKAGE_NAME}`);
			return count;
		} else {
			warn(
				`[RigSpawner] "${DEFAULT_RIG_PACKAGE_NAME}" not found in ServerStorage. ` +
					`Call scanFolder() or registerRig() to populate the catalog manually.`,
			);
			return 0;
		}
	}

	/**
	 * Spawn a rig by catalog ID at the given position.
	 * @returns The cloned Model, or undefined if the rig ID is not found.
	 */
	spawnRig(rigId: string, position: Vector3, config?: SpawnConfig): Model | undefined {
		const entry = this.catalog.get(rigId);
		if (!entry) {
			warn(`[RigSpawner] Rig "${rigId}" not found in catalog`);
			return undefined;
		}

		const clone = entry.modelTemplate.Clone();
		const tag = config?.spawnTag ?? DEFAULT_SPAWN_TAG;
		const parent = config?.parent ?? Workspace;

		// Position the rig
		clone.PivotTo(new CFrame(position));

		// Configure humanoid if provided
		if (config?.humanoidConfig) {
			const humanoid = clone.FindFirstChildWhichIsA("Humanoid");
			if (humanoid) {
				const hc = config.humanoidConfig;
				if (hc.maxHealth !== undefined) humanoid.MaxHealth = hc.maxHealth;
				if (hc.health !== undefined) humanoid.Health = hc.health;
				if (hc.walkSpeed !== undefined) humanoid.WalkSpeed = hc.walkSpeed;
				if (hc.jumpPower !== undefined) humanoid.JumpPower = hc.jumpPower;
				if (hc.displayName !== undefined) humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Subject;
			}
		}

		// Set spawn metadata attributes
		clone.SetAttribute("rigId", rigId);
		clone.SetAttribute("faction", entry.faction);
		clone.SetAttribute("spawnTime", os.clock());
		clone.SetAttribute("spawnX", position.X);
		clone.SetAttribute("spawnY", position.Y);
		clone.SetAttribute("spawnZ", position.Z);

		// Set custom attributes
		if (config?.attributes) {
			config.attributes.forEach((value, key) => {
				clone.SetAttribute(key, value);
			});
		}

		// Add CollectionService tag
		CollectionService.AddTag(clone, tag);

		// Parent to target (triggers replication)
		clone.Parent = parent;

		// Track internally
		this.spawnedRigs.set(clone, rigId);

		print(`[RigSpawner] Spawned ${entry.displayName} at (${position.X}, ${position.Y}, ${position.Z})`);
		return clone;
	}

	/** Destroy and clean up a spawned rig. */
	despawnRig(model: Model): void {
		this.spawnedRigs.delete(model);
		model.Destroy();
	}

	/** Despawn all currently tracked rigs. */
	despawnAll(): void {
		this.spawnedRigs.forEach((_, model) => {
			model.Destroy();
		});
		this.spawnedRigs.clear();
	}

	/** Get all catalog entries. */
	getRigCatalog(): RigEntry[] {
		return this.catalog.getAll();
	}

	/** Get catalog entries filtered by faction. */
	getRigsByFaction(faction: Faction): RigEntry[] {
		return this.catalog.getByFaction(faction);
	}

	/** Get a single catalog entry by rig ID. */
	getRigEntry(rigId: string): RigEntry | undefined {
		return this.catalog.get(rigId);
	}

	/** Register a custom rig not in the Asset Package. */
	registerRig(entry: RigEntry): void {
		this.catalog.register(entry);
	}

	/**
	 * Scan a custom folder for rigs (same folder structure as Asset Package).
	 * Use this if your rigs are not in the default ServerStorage location.
	 */
	scanFolder(container: Instance): number {
		return this.catalog.scanFolder(container);
	}

	/** Number of currently spawned rigs. */
	getSpawnedCount(): number {
		return this.spawnedRigs.size();
	}
}
