// ─── @trembus/inventory-model ─────────────────────────────────────────────────
//
// Positional backpack state: ordered slots addressed by 1-based slot number, with
// catalog-driven reconcile and pure move/swap transactions.
//
// Scope boundary — this package owns POSITION. It deliberately does not model named
// equipment slots, loadout categories, level gates, or item locking; those belong to
// `@trembus/slotable-items`, whose `validateDragDrop` complements this model rather
// than competing with it. Wire them together in the consuming game.

export type {
  BackpackState,
  ItemDefinition,
  ItemId,
  MoveDetail,
  MoveFailure,
  MoveFailureCode,
  MoveResult,
  MoveResultCode,
  MoveSuccess,
  MoveSuccessCode,
  RgbTriple,
  SlotNumber,
} from "./types";
export { EMPTY_SLOT } from "./types";

export type { ItemCatalog } from "./catalog";
export { createCatalog, createPermissiveCatalog } from "./catalog";

export {
  applyMove,
  createBackpack,
  DEFAULT_CAPACITY,
  getSlot,
  isValidSlot,
  move,
  occupiedSlots,
  reconcile,
} from "./backpack";

// The headless spec suite is reachable from the package root so a test place can run
// it the same way it runs @trembus/slotable-items' — see that repo's SpecRunnerService.
export type { SpecCase, SpecGroup, SpecReport } from "./__specs__";
export { runInventoryModelSpecs } from "./__specs__";
