// Action event bus — the third layer of the multi-device input architecture.
// Producers (InputManager via CAS, UI buttons via direct emit) push
// ActionEventPayload; consumers subscribe via onAction.
//
// Client-only construct. Don't replicate across the network — input semantics
// cross via RemoteEvents/Functions, not raw bus events.
//
// The bus is generic over the consumer's action type. Each game typically
// instantiates one shared bus:
//
//   export const inputBus = new InputBus<InputAction>();

import Signal from "@rbxts/signal";
import type { ActionEventPayload } from "./types";

export class InputBus<TAction extends string = string> {
	private actionSignal = new Signal<(payload: ActionEventPayload<TAction>) => void>();

	onAction(listener: (payload: ActionEventPayload<TAction>) => void) {
		return this.actionSignal.Connect(listener);
	}

	emit(payload: ActionEventPayload<TAction>): void {
		this.actionSignal.Fire(payload);
	}

	destroy(): void {
		this.actionSignal.Destroy();
	}
}
