export type { BasePlayerProfile, ProfileSettings, Migration, MigrationMap } from "./types";
export { isBasePlayerProfile, isProfileSettings } from "./types";

export {
	DEFAULT_STORE_NAME,
	DEFAULT_PROFILE_TEMPLATE,
	DEFAULT_SETTINGS,
	CURRENT_SCHEMA_VERSION,
	PROFILE_KEY_PREFIX,
} from "./constants";

export { migrateProfile, buildMigrationMap } from "./migrations";

export type { PersistentDataManagerConfig } from "./persistent-data";
export { PersistentDataManager } from "./persistent-data";

export type { PersistenceSlice } from "./slice";

export type { ComposedProfileConfig } from "./compose";
export { composeProfile } from "./compose";
