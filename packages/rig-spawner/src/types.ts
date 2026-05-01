/**
 * Faction categories matching the Asset Package - RIGS folder structure.
 */
export enum Faction {
	Blood = "Blood",
	Decay = "Decay",
	Fateless = "Fateless",
	Robots = "Robots",
	Spirit = "Spirit",
}

/**
 * A registered rig in the catalog.
 */
export interface RigEntry {
	/** Kebab-case identifier derived from Model.Name (e.g. "blood-bufferson") */
	rigId: string;
	/** Original model name (e.g. "Blood_Bufferson") */
	displayName: string;
	/** Faction this rig belongs to */
	faction: Faction;
	/** Reference to the template model (clone source) */
	modelTemplate: Model;
}

/**
 * Optional configuration when spawning a rig.
 */
export interface SpawnConfig {
	/** Parent instance for the spawned model. Default: Workspace */
	parent?: Instance;
	/** CollectionService tag to apply. Default: "SpawnedRig" */
	spawnTag?: string;
	/** Humanoid property overrides */
	humanoidConfig?: Partial<HumanoidConfig>;
	/** Custom attributes to set on the spawned model */
	attributes?: Map<string, AttributeValue>;
}

/**
 * Humanoid property configuration.
 */
export interface HumanoidConfig {
	maxHealth: number;
	health: number;
	walkSpeed: number;
	jumpPower: number;
	displayName: string;
}
