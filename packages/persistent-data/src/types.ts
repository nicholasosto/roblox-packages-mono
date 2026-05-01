import { t } from "@rbxts/t";

// ─── Settings ────────────────────────────────────────────────────────────────

export interface ProfileSettings {
	musicVolume: number;
	sfxVolume: number;
	graphicsQuality: number;
	showDamageNumbers: boolean;
	hideOtherPlayers: boolean;
}

// ─── Base Profile ─────────────────────────────────────────────────────────────

export interface BasePlayerProfile {
	version: number;

	displayName: string;
	firstJoin: number;
	lastLogin: number;
	playtime: number;

	currencies: Map<string, number>;

	settings: ProfileSettings;

	redeemedCodes: string[];
}

// ─── Migration Types ──────────────────────────────────────────────────────────

export type Migration<T extends BasePlayerProfile> = (data: T) => T;

export type MigrationMap<T extends BasePlayerProfile> = Map<number, Migration<T>>;

// ─── Runtime Validators ───────────────────────────────────────────────────────

export const isProfileSettings = t.interface({
	musicVolume: t.number,
	sfxVolume: t.number,
	graphicsQuality: t.number,
	showDamageNumbers: t.boolean,
	hideOtherPlayers: t.boolean,
});

export const isBasePlayerProfile = t.interface({
	version: t.number,
	displayName: t.string,
	firstJoin: t.number,
	lastLogin: t.number,
	playtime: t.number,
	currencies: t.map(t.string, t.number),
	settings: isProfileSettings,
	redeemedCodes: t.array(t.string),
});
