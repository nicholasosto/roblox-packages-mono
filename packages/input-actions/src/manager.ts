// InputManager — the producer side of the Action / Context / Bus architecture.
// Binds active contexts' device inputs through ContextActionService and emits
// ActionEventPayloads to an injected InputBus. Consumers subscribe to the bus
// and switch on payload.action — never on KeyCode.
//
// Framework-agnostic by design: no Flamework decorators, no lifecycle macros.
// Consuming projects wrap this in their own thin controller (Flamework, Knit,
// vanilla, etc.) and own the lifecycle.

import { ContextActionService, UserInputService } from "@rbxts/services";
import type { InputBus } from "./bus";
import {
	ActionPhase,
	type ActionEventPayload,
	type Binding,
	type InputContext,
	type KeyChord,
} from "./types";

interface CompiledAction<TAction extends string> {
	triggerInputs: Array<Enum.KeyCode | Enum.UserInputType>;
	// Only multi-key chords are tracked here; single-key triggers are validated
	// implicitly by CAS firing on the bound key. See matchesChord() for the
	// mixed-case logic (multi-key chord + single-key fallback on the same action).
	chords: Array<KeyChord>;
	showTouchButton: boolean;
}

export class InputManager<TAction extends string> {
	private activeContexts: Array<InputContext<TAction>> = [];

	constructor(private readonly bus: InputBus<TAction>) {}

	/** Enable a starting set of contexts. Idempotent. */
	start(initialContexts: ReadonlyArray<InputContext<TAction>>): void {
		for (const ctx of initialContexts) this.enableContext(ctx);
	}

	enableContext(context: InputContext<TAction>): void {
		if (this.activeContexts.find((c) => c.name === context.name) !== undefined) return;
		this.activeContexts.push(context);
		this.bindContext(context);
	}

	disableContext(name: string): void {
		const index = this.activeContexts.findIndex((c) => c.name === name);
		if (index === -1) return;
		const context = this.activeContexts[index];
		this.activeContexts.remove(index);
		for (const [actionKey] of pairs(context.bindings)) {
			ContextActionService.UnbindAction(this.casNameFor(context, actionKey as TAction));
		}
	}

	/** Unbind every active context. Call from your wrapper's teardown. */
	destroy(): void {
		const snapshot = [...this.activeContexts];
		for (const ctx of snapshot) this.disableContext(ctx.name);
	}

	private bindContext(context: InputContext<TAction>): void {
		const sink = context.sink === true;
		for (const [actionKey, bindings] of pairs(context.bindings)) {
			const action = actionKey as TAction;
			const bindingArr = (bindings ?? []) as ReadonlyArray<Binding>;
			const compiled = this.compile(bindingArr);
			if (compiled.triggerInputs.size() === 0) continue;

			ContextActionService.BindAction(
				this.casNameFor(context, action),
				(_, state, rawInput) => {
					if (state === Enum.UserInputState.Cancel) return Enum.ContextActionResult.Pass;
					if (!this.matchesChord(compiled.chords, rawInput)) {
						return Enum.ContextActionResult.Pass;
					}

					const payload: ActionEventPayload<TAction> = {
						action,
						phase: this.mapState(state),
						rawInput,
					};
					this.populateAnalog(payload, rawInput);
					this.bus.emit(payload);
					return sink ? Enum.ContextActionResult.Sink : Enum.ContextActionResult.Pass;
				},
				compiled.showTouchButton,
				...compiled.triggerInputs,
			);
		}
	}

	private compile(bindings: ReadonlyArray<Binding>): CompiledAction<TAction> {
		const triggerInputs: Array<Enum.KeyCode | Enum.UserInputType> = [];
		const chords: Array<KeyChord> = [];
		let showTouchButton = false;

		for (const binding of bindings) {
			if (binding.device === "KBM") {
				if (binding.keys !== undefined) {
					for (const chord of binding.keys) {
						if (chord.size() === 0) continue;
						// Trigger on the final key; prefix keys verified via IsKeyDown.
						triggerInputs.push(chord[chord.size() - 1]);
						if (chord.size() > 1) chords.push(chord);
					}
				}
				if (binding.mouseButtons !== undefined) {
					for (const button of binding.mouseButtons) triggerInputs.push(button);
				}
				if (binding.axis === "MouseDelta") {
					triggerInputs.push(Enum.UserInputType.MouseMovement);
				}
				if (binding.axis === "Wheel") triggerInputs.push(Enum.UserInputType.MouseWheel);
			} else if (binding.device === "Gamepad") {
				if (binding.buttons !== undefined) {
					for (const button of binding.buttons) triggerInputs.push(button);
				}
				if (binding.axis2D === "Thumbstick1") triggerInputs.push(Enum.KeyCode.Thumbstick1);
				if (binding.axis2D === "Thumbstick2") triggerInputs.push(Enum.KeyCode.Thumbstick2);
				if (binding.axis1D === "TriggerL") triggerInputs.push(Enum.KeyCode.ButtonL2);
				if (binding.axis1D === "TriggerR") triggerInputs.push(Enum.KeyCode.ButtonR2);
			} else {
				// Touch
				if (binding.virtualButtonKey !== undefined) {
					// virtualButtonKey doubles as the touch-button glyph slot (via CAS
					// showTouchButton) AND a real KeyCode binding (gamepad button passthrough).
					triggerInputs.push(binding.virtualButtonKey);
				}
				if (binding.showTouchButton === true) showTouchButton = true;
			}
		}

		return { triggerInputs, chords, showTouchButton };
	}

	private matchesChord(chords: ReadonlyArray<KeyChord>, rawInput: InputObject): boolean {
		if (chords.size() === 0) return true;
		// Chords are KBM-only; non-keyboard inputs (mouse buttons, gamepad,
		// virtual touch buttons) always pass.
		if (rawInput.UserInputType !== Enum.UserInputType.Keyboard) return true;

		const triggerKey = rawInput.KeyCode;
		let triggerIsChordFinalKey = false;
		for (const chord of chords) {
			const finalKey = chord[chord.size() - 1];
			if (finalKey !== triggerKey) continue;
			triggerIsChordFinalKey = true;
			let allHeld = true;
			for (let i = 0; i < chord.size() - 1; i++) {
				if (!UserInputService.IsKeyDown(chord[i])) {
					allHeld = false;
					break;
				}
			}
			if (allHeld) return true;
		}
		// If the trigger key is a chord-final-key but no chord's prefix was held,
		// suppress. Otherwise the key fired from a separate single-key binding on
		// this same action — let it through.
		return !triggerIsChordFinalKey;
	}

	private populateAnalog(
		payload: ActionEventPayload<TAction>,
		rawInput: InputObject,
	): void {
		const uit = rawInput.UserInputType;
		if (
			uit === Enum.UserInputType.Gamepad1 ||
			uit === Enum.UserInputType.Gamepad2 ||
			uit === Enum.UserInputType.Gamepad3 ||
			uit === Enum.UserInputType.Gamepad4
		) {
			const kc = rawInput.KeyCode;
			if (kc === Enum.KeyCode.Thumbstick1 || kc === Enum.KeyCode.Thumbstick2) {
				payload.vec2 = new Vector2(rawInput.Position.X, rawInput.Position.Y);
				return;
			}
			if (kc === Enum.KeyCode.ButtonL2 || kc === Enum.KeyCode.ButtonR2) {
				payload.value1D = rawInput.Position.Z;
				return;
			}
		}
		if (uit === Enum.UserInputType.MouseMovement) {
			payload.vec2 = new Vector2(rawInput.Delta.X, rawInput.Delta.Y);
			return;
		}
		if (uit === Enum.UserInputType.MouseWheel) {
			payload.value1D = rawInput.Position.Z;
		}
	}

	private casNameFor(context: InputContext<TAction>, action: TAction): string {
		return `${context.name}_${action}`;
	}

	private mapState(state: Enum.UserInputState): ActionPhase {
		if (state === Enum.UserInputState.Begin) return ActionPhase.Started;
		if (state === Enum.UserInputState.Change) return ActionPhase.Changed;
		return ActionPhase.Ended;
	}
}
