// ─── Runtime validators — use on every server-facing entry point ─────────────
//
// Every remote-event handler that consumes pet/mount data from a client MUST
// pass the payload through one of these checkers before trusting it.
// Brain-scar: "Not validating network input server-side — clients can send anything."
// ─────────────────────────────────────────────────────────────────────────────

import { t } from "@rbxts/t";

export const isPetInstance = t.interface({
	guid: t.string,
	catalogId: t.string,
	ownerUserId: t.number,
	acquiredAt: t.number,
	nickname: t.optional(t.string),
});

export const isMountInstance = t.interface({
	guid: t.string,
	catalogId: t.string,
	ownerUserId: t.number,
	acquiredAt: t.number,
	nickname: t.optional(t.string),
});

/** Guard for the minimum shape a PetDefinition must satisfy. */
export const isPetDefinition = t.interface({
	catalogId: t.string,
	displayName: t.string,
	rigId: t.string,
	anims: t.interface({
		idle: t.string,
		walk: t.string,
	}),
});

/** Guard for the minimum shape a MountDefinition must satisfy. */
export const isMountDefinition = t.interface({
	catalogId: t.string,
	displayName: t.string,
	rigId: t.string,
	anims: t.interface({
		idle: t.string,
		walk: t.string,
		run: t.string,
	}),
	seatOffset: t.Vector3,
	baseWalkSpeed: t.number,
});

/** Guard for a non-empty catalog ID arg from the network. */
export const isCatalogIdArg = t.string;

/** Guard for an optional GUID (used by setActivePet / setActiveMount). */
export const isGuidOrUndefined = t.optional(t.string);
