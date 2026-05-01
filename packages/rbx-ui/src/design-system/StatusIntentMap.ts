/**
 * Status → Color Intent Mapping
 *
 * Shared between web and Roblox. Maps 70+ status strings to 6 color intents.
 * Web equivalent: STATUS_COLORS in @trembus/ui-library StatusBadge.tsx
 */
import { ColorIntent } from "./Tokens";

export const STATUS_INTENT_MAP: Record<string, ColorIntent> = {
	// Product lifecycle
	draft: "neutral",
	testing: "warning",
	published: "success",
	deprecated: "danger",
	archived: "neutral",

	// Roadmap lifecycle
	planned: "info",
	active: "warning",
	completed: "success",

	// Instruction lifecycle
	superseded: "neutral",

	// Lore lifecycle
	canonical: "success",

	// Asset lifecycle
	generated: "info",
	reviewed: "warning",

	// Decision lifecycle
	proposed: "info",
	accepted: "success",
	rejected: "danger",

	// Neural types
	engram: "info",
	circuit: "warning",
	concept: "success",
	reflex: "danger",
	dream: "accent",
	trace: "neutral",

	// Chip Factory lifecycle
	released: "success",

	// Pipeline stages
	design: "info",
	refining: "accent",
	"lab-testing": "warning",
	pass: "success",
	fail: "danger",
	building: "warning",
	qualifying: "accent",

	// Flamework architecture
	implemented: "success",
	"in-progress": "warning",

	// Factory status
	online: "success",
	offline: "neutral",

	// HR — Agent lifecycle
	candidate: "info",
	onboarding: "accent",
	training: "warning",
	"on-leave": "neutral",
	"under-review": "danger",
	retired: "neutral",

	// HR — Position lifecycle
	open: "accent",
	evaluating: "warning",
	filled: "success",
	closed: "neutral",

	// HR — Review lifecycle
	finalized: "success",
	acknowledged: "info",

	// HR — Review ratings
	exceptional: "success",
	strong: "info",
	"meets-expectations": "warning",
	"needs-improvement": "danger",
	unsatisfactory: "danger",

	// HR — Training
	available: "info",
	enrolled: "accent",
	failed: "danger",

	// HR — Teams
	forming: "info",
	disbanded: "neutral",
};

export function getIntent(status: string): ColorIntent {
	return STATUS_INTENT_MAP[status] ?? "neutral";
}
