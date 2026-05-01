import type { AudioCategory } from "./types";

export const DEFAULT_MASTER_VOLUME = 1;
export const DEFAULT_CATEGORY_VOLUME = 1;
export const DEFAULT_CROSSFADE_DURATION = 1.5;
export const DEFAULT_FADE_OUT_DURATION = 0.5;
export const DEFAULT_POOL_SIZE = 5;
export const MAX_POOL_SIZE = 20;

export const DEFAULT_CATEGORY_VOLUMES = new Map<AudioCategory, number>([
	["sfx", 1],
	["music", 1],
	["ambient", 1],
	["ui", 1],
]);

export const LOG_TAG = "Audio";
