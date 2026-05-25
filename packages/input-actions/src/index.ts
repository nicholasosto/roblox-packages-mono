// ─── @trembus/input-actions: Barrel Exports ──────────────────────────────────

// Types, enums & interfaces
export {
	ActionPhase,
	type ActionEventPayload,
	type Binding,
	type InputContext,
	type KeyChord,
} from "./types";

// Event bus
export { InputBus } from "./bus";

// Manager (producer layer — wraps CAS)
export { InputManager } from "./manager";
