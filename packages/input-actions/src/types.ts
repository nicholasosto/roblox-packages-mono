// Three-layer multi-device input architecture.
// Layer 1 — Actions (logical names, device-agnostic, defined by the consumer).
// Layer 2 — Contexts (priority-stacked binding sets).
// Layer 3 — Bus (signal-based event fan-out — see ./bus).
//
// Consumers provide their own `InputAction` enum (or string union); types are
// parameterized via `TAction extends string`.

export enum ActionPhase {
	Started = "Started", // Enum.UserInputState.Begin
	Changed = "Changed", // Enum.UserInputState.Change
	Ended = "Ended", // Enum.UserInputState.End
}

export interface ActionEventPayload<TAction extends string = string> {
	action: TAction;
	phase: ActionPhase;
	vec2?: Vector2; // movement vector / mouse delta / thumbstick (analog)
	value1D?: number; // trigger value / scroll wheel (analog)
	rawInput?: InputObject;
}

// A "chord" is one or more KeyCodes pressed together. Multi-key chords trigger
// on the FINAL key while all prefix keys are held — InputManager polls
// UserInputService.IsKeyDown for the prefix verification.
export type KeyChord = Array<Enum.KeyCode>;

export type Binding =
	| {
			device: "KBM";
			keys?: Array<KeyChord>;
			mouseButtons?: Array<Enum.UserInputType>;
			axis?: "MouseDelta" | "Wheel";
	  }
	| {
			device: "Gamepad";
			buttons?: Array<Enum.KeyCode>;
			axis2D?: "Thumbstick1" | "Thumbstick2";
			axis1D?: "TriggerL" | "TriggerR";
	  }
	| {
			device: "Touch";
			// Gestures are reserved for future expansion; InputManager does not bind
			// them yet — use `virtualButtonKey` for tap-like inputs today.
			gestures?: Array<"Tap" | "Swipe" | "LongPress">;
			virtualButtonKey?: Enum.KeyCode;
			showTouchButton?: boolean;
	  };

export interface InputContext<TAction extends string = string> {
	name: string;
	priority: number; // higher wins per action; suggested tiers: Gameplay 50, Menu 100, Minigame 200+
	bindings: Partial<Record<TAction, Array<Binding>>>;
	enabledByDefault?: boolean;
	/** When true, the CAS callback returns Sink so lower-priority contexts with
	 *  the same input bound don't ALSO fire. Use for modal contexts (e.g. a
	 *  pause menu binding Q while gameplay also binds Q for cancel). */
	sink?: boolean;
}
