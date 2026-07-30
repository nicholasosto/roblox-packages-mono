// ─── Inventory Model: Positional Backpack ─────────────────────────────────────
//
// Pure functions over an immutable BackpackState. No engine calls, no services, no
// mutation of inputs — every operation returns fresh storage. Ported from the Studio
// UI lab's InventoryModel.luau, whose result-code vocabulary is preserved verbatim
// so the lab's existing drag harness keeps asserting against a live implementation.

import type { ItemCatalog } from "./catalog";
import type { BackpackState, ItemId, MoveResult, SlotNumber } from "./types";
import { EMPTY_SLOT } from "./types";

/** Default capacity, matching the Studio prototype's 6-slot grid. */
export const DEFAULT_CAPACITY = 6;

function emptySlots(capacity: number): ItemId[] {
  const slots: ItemId[] = [];
  for (let index = 0; index < capacity; index++) slots.push(EMPTY_SLOT);
  return slots;
}

function copySlots(source: readonly ItemId[], capacity: number): ItemId[] {
  const slots = emptySlots(capacity);
  for (let index = 0; index < capacity; index++) {
    const value = source[index];
    if (value !== undefined) slots[index] = value;
  }
  return slots;
}

/** An empty backpack of the given capacity. */
export function createBackpack(capacity: number = DEFAULT_CAPACITY): BackpackState {
  return { capacity, slots: emptySlots(capacity) };
}

/** True when `slotNumber` is a whole number inside 1..capacity. */
export function isValidSlot(state: BackpackState, slotNumber: SlotNumber): boolean {
  return (
    slotNumber === math.floor(slotNumber) && slotNumber >= 1 && slotNumber <= state.capacity
  );
}

/** The item in slot N (1-based), or `EMPTY_SLOT`. Out-of-range reads are empty, not errors. */
export function getSlot(state: BackpackState, slotNumber: SlotNumber): ItemId {
  if (!isValidSlot(state, slotNumber)) return EMPTY_SLOT;
  const value = state.slots[slotNumber - 1];
  return value !== undefined ? value : EMPTY_SLOT;
}

/** Every occupied slot, in order, as `[slotNumber, itemId]` pairs. */
export function occupiedSlots(state: BackpackState): Array<[SlotNumber, ItemId]> {
  const result: Array<[SlotNumber, ItemId]> = [];
  for (let index = 0; index < state.capacity; index++) {
    const value = state.slots[index];
    if (value !== undefined && value !== EMPTY_SLOT) result.push([index + 1, value]);
  }
  return result;
}

function readRawSlots(raw: unknown): readonly unknown[] {
  if (!typeIs(raw, "table")) return [];
  const container = raw as { slots?: unknown };
  const slots = container.slots;
  if (!typeIs(slots, "table")) return [];
  return slots as readonly unknown[];
}

/**
 * Coerce untrusted storage (a datastore blob, a stale client payload) into a valid
 * BackpackState. Anything that is not a known, non-duplicate item id becomes an empty
 * slot; the first occurrence of a duplicated id wins. Never throws — a completely
 * malformed input yields an empty backpack.
 */
export function reconcile(
  raw: unknown,
  catalog: ItemCatalog,
  capacity: number = DEFAULT_CAPACITY,
): BackpackState {
  const rawSlots = readRawSlots(raw);
  const slots = emptySlots(capacity);
  const seen = new Set<ItemId>();

  for (let index = 0; index < capacity; index++) {
    const candidate = rawSlots[index];
    if (!typeIs(candidate, "string")) continue;
    if (candidate === EMPTY_SLOT) continue;
    if (!catalog.has(candidate)) continue;
    if (seen.has(candidate)) continue;
    slots[index] = candidate;
    seen.add(candidate);
  }

  return { capacity, slots };
}

/**
 * Move the item in `fromSlot` to `toSlot`, swapping with whatever is already there.
 *
 * `expectedItemId` is an optimistic-concurrency guard: the caller states which item it
 * believes it is dragging, and a mismatch fails with `STALE_SOURCE_ITEM` rather than
 * moving whatever happens to be there now. This is what makes the operation safe to
 * issue from a client whose view may be a frame behind the server.
 *
 * The input state is never mutated; `result.slots` is always safe to adopt, including
 * on failure, where it carries the reconciled-but-unchanged storage.
 */
export function move(
  state: BackpackState,
  fromSlot: SlotNumber,
  toSlot: SlotNumber,
  expectedItemId: ItemId,
): MoveResult {
  const slots = copySlots(state.slots, state.capacity);

  if (!isValidSlot(state, fromSlot)) {
    return { ok: false, code: "INVALID_SOURCE_SLOT", slots };
  }
  if (!isValidSlot(state, toSlot)) {
    return { ok: false, code: "INVALID_TARGET_SLOT", slots };
  }
  if (fromSlot === toSlot) {
    return { ok: false, code: "SAME_SLOT", slots };
  }

  const sourceItemId = getSlot(state, fromSlot);
  if (sourceItemId === EMPTY_SLOT) {
    return { ok: false, code: "SOURCE_EMPTY", slots };
  }
  if (expectedItemId !== sourceItemId) {
    return { ok: false, code: "STALE_SOURCE_ITEM", slots };
  }

  const targetItemId = getSlot(state, toSlot);
  const nextSlots = copySlots(state.slots, state.capacity);
  nextSlots[fromSlot - 1] = targetItemId;
  nextSlots[toSlot - 1] = sourceItemId;

  return {
    ok: true,
    code: targetItemId === EMPTY_SLOT ? "INVENTORY_MOVED" : "INVENTORY_SWAPPED",
    slots: nextSlots,
    move: {
      fromSlot,
      toSlot,
      itemId: sourceItemId,
      displacedItemId: targetItemId,
    },
  };
}

/** Apply a successful move, returning the next state. Failures return the input unchanged. */
export function applyMove(state: BackpackState, result: MoveResult): BackpackState {
  if (!result.ok) return state;
  return { capacity: state.capacity, slots: result.slots };
}
