import { Faction } from "./types";

/** Default name of the rig package folder in ServerStorage */
export const DEFAULT_RIG_PACKAGE_NAME = "Asset Package - RIGS";

/** Default CollectionService tag applied to spawned rigs */
export const DEFAULT_SPAWN_TAG = "SpawnedRig";

/** Maps folder names in the Asset Package to Faction enum values */
export const FACTION_FOLDER_MAP = new Map<string, Faction>([
	["Blood", Faction.Blood],
	["Decay", Faction.Decay],
	["Fateless", Faction.Fateless],
	["Robots", Faction.Robots],
	["Spirit", Faction.Spirit],
]);
