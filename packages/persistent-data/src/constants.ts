import { ProfileSettings, BasePlayerProfile } from "./types";

export const DEFAULT_STORE_NAME = "PlayerData";

export const CURRENT_SCHEMA_VERSION = 1;

export const PROFILE_KEY_PREFIX = "Player_";

export const DEFAULT_SETTINGS: ProfileSettings = {
	musicVolume: 0.8,
	sfxVolume: 1.0,
	graphicsQuality: 3,
	showDamageNumbers: true,
	hideOtherPlayers: false,
};

export const DEFAULT_PROFILE_TEMPLATE: BasePlayerProfile = {
	version: CURRENT_SCHEMA_VERSION,
	displayName: "",
	firstJoin: 0,
	lastLogin: 0,
	playtime: 0,
	currencies: new Map<string, number>(),
	settings: DEFAULT_SETTINGS,
	redeemedCodes: [],
};
