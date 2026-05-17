// ─── Pets & Mounts: module-level Signal bus ──────────────────────────────────
//
// Module-level signals so consumers can subscribe once at startup and avoid
// the "mount-after-fire" race where a server-fired event arrives before a
// React subscriber renders. Brain-scar: [[Mount-After-Fire Race Pattern]].
// ─────────────────────────────────────────────────────────────────────────────

import Signal from "@rbxts/signal";
import type {
	MountInstance,
	PetInstance,
	SpawnedMount,
	SpawnedPet,
} from "./types";

export namespace PetMountSignals {
	export const petSummoned = new Signal<(owner: Player, spawned: SpawnedPet) => void>();
	export const petDismissed = new Signal<(owner: Player, instance: PetInstance) => void>();

	export const mountSummoned = new Signal<(owner: Player, spawned: SpawnedMount) => void>();
	export const mountDismissed = new Signal<(owner: Player, instance: MountInstance) => void>();

	export const mountMounted = new Signal<(owner: Player, spawned: SpawnedMount) => void>();
	export const mountDismounted = new Signal<(owner: Player, instance: MountInstance) => void>();
}
