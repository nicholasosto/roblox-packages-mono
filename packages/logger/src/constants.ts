import { LogLevel } from "./types";

export const LEVEL_PRIORITY = new Map<LogLevel, number>([
	["debug", 0],
	["info", 1],
	["warn", 2],
	["error", 3],
]);

export const DEFAULT_GLOBAL_LEVEL: LogLevel = "info";

export const DIVIDER_CHAR = "=";
export const DIVIDER_WIDTH = 50;

export const SUCCESS_PREFIX = "[OK]";
export const FAIL_PREFIX = "[FAIL]";
