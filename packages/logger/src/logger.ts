import { LogLevel } from "./types";
import { LogFilter } from "./log-filter";
import { Formatter } from "./formatter";

// Alias Roblox globals before the class shadows them
const robloxPrint = print;
const robloxWarn = warn;

export class Logger {
	private tag: string;
	private indentDepth = 0;

	private constructor(tag: string) {
		this.tag = tag;
	}

	// ─── Static factory ───────────────────────────────────────────────────

	static create(tag: string): Logger {
		return new Logger(tag);
	}

	// ─── Static filter controls ───────────────────────────────────────────

	static setGlobalLevel(level: LogLevel): void {
		LogFilter.setGlobalLevel(level);
	}

	static setTagLevel(tag: string, level: LogLevel): void {
		LogFilter.setTagLevel(tag, level);
	}

	static clearTagLevel(tag: string): void {
		LogFilter.clearTagLevel(tag);
	}

	// ─── Core logging ─────────────────────────────────────────────────────

	private indent(): string {
		let pad = "";
		for (let i = 0; i < this.indentDepth; i++) {
			pad = pad + "  ";
		}
		return pad;
	}

	private prefix(): string {
		return "[" + this.tag + "] " + this.indent();
	}

	debug(message: string): void {
		if (!LogFilter.shouldEmit(this.tag, "debug")) return;
		robloxPrint(this.prefix() + "[DEBUG] " + message);
	}

	info(message: string): void {
		if (!LogFilter.shouldEmit(this.tag, "info")) return;
		robloxPrint(this.prefix() + message);
	}

	warn(message: string): void {
		if (!LogFilter.shouldEmit(this.tag, "warn")) return;
		robloxWarn(this.prefix() + "[WARN] " + message);
	}

	error(message: string): void {
		if (!LogFilter.shouldEmit(this.tag, "error")) return;
		robloxWarn(this.prefix() + "[ERROR] " + message);
	}

	// ─── Formatting helpers ───────────────────────────────────────────────

	divider(): void {
		robloxPrint(this.prefix() + Formatter.divider());
	}

	header(title: string): void {
		robloxPrint(this.prefix() + Formatter.header(title));
	}

	table(data: Map<string, string>): void {
		const lines = Formatter.tableLines(data);
		for (const line of lines) {
			robloxPrint(this.prefix() + line);
		}
	}

	list(items: string[]): void {
		const lines = Formatter.listLines(items);
		for (const line of lines) {
			robloxPrint(this.prefix() + line);
		}
	}

	group(label: string): void {
		robloxPrint(this.prefix() + "> " + label);
		this.indentDepth++;
	}

	groupEnd(): void {
		if (this.indentDepth > 0) {
			this.indentDepth--;
		}
	}

	success(message: string): void {
		if (!LogFilter.shouldEmit(this.tag, "info")) return;
		robloxPrint(this.prefix() + Formatter.successLine(message));
	}

	fail(message: string): void {
		if (!LogFilter.shouldEmit(this.tag, "error")) return;
		robloxWarn(this.prefix() + Formatter.failLine(message));
	}
}
