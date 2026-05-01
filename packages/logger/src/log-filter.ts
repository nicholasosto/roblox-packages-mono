import { LogLevel } from "./types";
import { LEVEL_PRIORITY, DEFAULT_GLOBAL_LEVEL } from "./constants";

let globalLevel: LogLevel = DEFAULT_GLOBAL_LEVEL;
const tagLevels = new Map<string, LogLevel>();

export namespace LogFilter {
	export function setGlobalLevel(level: LogLevel): void {
		globalLevel = level;
	}

	export function getGlobalLevel(): LogLevel {
		return globalLevel;
	}

	export function setTagLevel(tag: string, level: LogLevel): void {
		tagLevels.set(tag, level);
	}

	export function clearTagLevel(tag: string): void {
		tagLevels.delete(tag);
	}

	export function clearAllTagLevels(): void {
		tagLevels.clear();
	}

	export function getEffectiveLevel(tag: string): LogLevel {
		return tagLevels.get(tag) ?? globalLevel;
	}

	export function shouldEmit(tag: string, messageLevel: LogLevel): boolean {
		const effectivePriority = LEVEL_PRIORITY.get(getEffectiveLevel(tag)) ?? 1;
		const messagePriority = LEVEL_PRIORITY.get(messageLevel) ?? 0;
		return messagePriority >= effectivePriority;
	}
}
