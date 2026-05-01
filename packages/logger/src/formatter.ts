import { DIVIDER_CHAR, DIVIDER_WIDTH, SUCCESS_PREFIX, FAIL_PREFIX } from "./constants";

export namespace Formatter {
	function repeatChar(char: string, count: number): string {
		let result = "";
		for (let i = 0; i < count; i++) {
			result = result + char;
		}
		return result;
	}

	export function divider(): string {
		return repeatChar(DIVIDER_CHAR, DIVIDER_WIDTH);
	}

	export function header(title: string): string {
		const prefix = "=== " + title + " ";
		const remaining = DIVIDER_WIDTH - prefix.size();
		const suffix = remaining > 0 ? repeatChar(DIVIDER_CHAR, remaining) : "";
		return prefix + suffix;
	}

	export function tableLines(data: Map<string, string>): string[] {
		let maxKeyLen = 0;
		data.forEach((_, key) => {
			if (key.size() > maxKeyLen) {
				maxKeyLen = key.size();
			}
		});

		const lines: string[] = [];
		data.forEach((value, key) => {
			const padding = repeatChar(" ", maxKeyLen - key.size());
			lines.push("  " + key + padding + "  :  " + value);
		});
		return lines;
	}

	export function listLines(items: string[]): string[] {
		const lines: string[] = [];
		for (const item of items) {
			lines.push("  - " + item);
		}
		return lines;
	}

	export function successLine(message: string): string {
		return SUCCESS_PREFIX + " " + message;
	}

	export function failLine(message: string): string {
		return FAIL_PREFIX + " " + message;
	}
}
