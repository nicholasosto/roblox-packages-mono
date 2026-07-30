// ─── Inventory Model: Core Types ──────────────────────────────────────────────
//
// SLOT NUMBERING. Slot numbers in this package's public API are 1-BASED, matching
// the domain ("slot 1"), the Studio harness attribute vocabulary
// (`TestId = "inventory.slot.1.drag"`), and the Luau prototype this model was
// ported from. `BackpackState.slots` is the raw 0-indexed storage array — slot N
// lives at `slots[N - 1]`. Read through `getSlot()` rather than indexing directly.

/** Catalog identity of an item. The empty string is the canonical "no item" value. */
export type ItemId = string;

/** The sentinel occupying an unfilled slot. Never `undefined` — slots always exist. */
export const EMPTY_SLOT: ItemId = "";

/** 1-based position within a backpack. */
export type SlotNumber = number;

/** RGB triple, 0–255 per channel. Kept engine-free so the model stays pure. */
export type RgbTriple = readonly [number, number, number];

/**
 * A catalog entry. Presentation fields (`icon`, `rarityColor`) live here because the
 * prototype carried them, but the model itself only ever reads `id` — everything else
 * is passed through untouched for a view layer to interpret.
 */
export interface ItemDefinition {
  readonly id: ItemId;
  readonly name: string;
  readonly icon: string;
  readonly rarity: string;
  readonly rarityColor: RgbTriple;
}

// ── Result Codes ──────────────────────────────────────────────────────────────
//
// These string values are a COMPATIBILITY SURFACE, not an implementation detail:
// the Studio UI lab writes them to `ScreenGui.LastDragResult` and its harness
// asserts on them. Renaming one silently breaks that QA channel — add, don't rename.

export type MoveSuccessCode = "INVENTORY_MOVED" | "INVENTORY_SWAPPED";

export type MoveFailureCode =
  | "INVALID_SOURCE_SLOT"
  | "INVALID_TARGET_SLOT"
  | "SAME_SLOT"
  | "SOURCE_EMPTY"
  | "STALE_SOURCE_ITEM";

export type MoveResultCode = MoveSuccessCode | MoveFailureCode;

/** What actually changed hands. Present only on a successful move. */
export interface MoveDetail {
  readonly fromSlot: SlotNumber;
  readonly toSlot: SlotNumber;
  readonly itemId: ItemId;
  /** The item pushed back to `fromSlot`, or `EMPTY_SLOT` when the target was empty. */
  readonly displacedItemId: ItemId;
}

export interface MoveSuccess {
  readonly ok: true;
  readonly code: MoveSuccessCode;
  /** Post-move storage. The input state is never mutated. */
  readonly slots: readonly ItemId[];
  readonly move: MoveDetail;
}

export interface MoveFailure {
  readonly ok: false;
  readonly code: MoveFailureCode;
  /** The reconciled slots as they stand — safe to adopt even on failure. */
  readonly slots: readonly ItemId[];
}

/**
 * Discriminated on `ok`, so `result.move` is reachable only after a success check.
 * This is the one deliberate upgrade over the Luau original, which returned a single
 * shape with an optional `move` field that callers had to remember to guard.
 */
export type MoveResult = MoveSuccess | MoveFailure;

// ── Backpack State ────────────────────────────────────────────────────────────

export interface BackpackState {
  /** Number of slots. Fixed for the lifetime of a state value. */
  readonly capacity: number;
  /** 0-indexed storage; slot N is `slots[N - 1]`. Prefer `getSlot()`. */
  readonly slots: readonly ItemId[];
}
