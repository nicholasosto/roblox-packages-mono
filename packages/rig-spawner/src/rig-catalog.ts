import { Faction, RigEntry } from "./types";
import { FACTION_FOLDER_MAP } from "./constants";

/**
 * Registry of available rig models. Scans a container folder to auto-discover
 * rigs organized by faction, or accepts manual registration.
 */
export class RigCatalog {
	private entries = new Map<string, RigEntry>();

	/**
	 * Scan a container for rig models organized in faction subfolders.
	 * Expected structure: container/FactionName/ModelName
	 * @returns Number of rigs discovered
	 */
	scanFolder(container: Instance): number {
		let count = 0;

		for (const child of container.GetChildren()) {
			if (!child.IsA("Folder")) continue;

			const faction = FACTION_FOLDER_MAP.get(child.Name);
			if (faction === undefined) {
				warn(`[RigCatalog] Unknown faction folder: ${child.Name}, skipping`);
				continue;
			}

			for (const model of child.GetChildren()) {
				if (!model.IsA("Model")) continue;
				if (!model.FindFirstChildWhichIsA("Humanoid")) {
					warn(`[RigCatalog] Model ${model.Name} has no Humanoid, skipping`);
					continue;
				}

				const rigId = this.toRigId(model.Name);
				this.entries.set(rigId, {
					rigId,
					displayName: model.Name,
					faction,
					modelTemplate: model,
				});
				count++;
			}
		}

		return count;
	}

	/** Register a rig manually. */
	register(entry: RigEntry): void {
		this.entries.set(entry.rigId, entry);
	}

	/** Get a rig entry by ID. */
	get(rigId: string): RigEntry | undefined {
		return this.entries.get(rigId);
	}

	/** Get all registered rig entries. */
	getAll(): RigEntry[] {
		const result: RigEntry[] = [];
		this.entries.forEach((entry) => result.push(entry));
		return result;
	}

	/** Get all rigs belonging to a faction. */
	getByFaction(faction: Faction): RigEntry[] {
		const result: RigEntry[] = [];
		this.entries.forEach((entry) => {
			if (entry.faction === faction) result.push(entry);
		});
		return result;
	}

	/** Check if a rig ID is registered. */
	has(rigId: string): boolean {
		return this.entries.has(rigId);
	}

	/** Number of registered rigs. */
	size(): number {
		return this.entries.size();
	}

	/** Convert a model name to a kebab-case rig ID. */
	private toRigId(name: string): string {
		return name.lower().gsub("_", "-")[0];
	}
}
