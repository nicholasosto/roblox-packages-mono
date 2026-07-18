// ─── Slotable Items: Network Operation Types ─────────────────────────────────
import type { UniversalSlotTypeKey, SlotCategoryKey } from './slot-types';
import type { BaseSlotableInstance } from './base-types';
import type { UnifiedInventorySnapshot } from './inventory';

// v1.0: the item-carrying fields use the OPEN `BaseSlotableInstance` (was the 5-built-in
// `AnySlotableInstance` union) so the reference engine can carry game-registered kinds
// (Tower/Rune/…) too. Consumers narrow/cast at the edge — the package's standard idiom.

// ── Failure Reasons ──────────────────────────────────────────────────────────

export type LoadoutOperationFailureReason =
  | "ProfileNotLoaded"
  | "OwnershipMismatch"
  | "ItemNotInInventory"
  | "ItemNotEquipped"
  | "CatalogMissing"
  | "SlotLocked"
  | "SlotEmpty"
  | "IncompatibleSlot"
  | "SlotTypeInvalid"
  | "BackpackFull"
  | "CollectionFull"
  | "InventoryFull"
  | "LevelTooLow"
  | "ItemLocked"
  | "SameSlot";

// ── Base Result ──────────────────────────────────────────────────────────────

export interface LoadoutOperationResultBase {
  readonly success: boolean;
  readonly reason?: LoadoutOperationFailureReason;
}

// ── Equip ────────────────────────────────────────────────────────────────────

export interface EquipItemRequest {
  readonly itemGuid: string;
  readonly targetSlot: UniversalSlotTypeKey;
}

export interface EquipItemResult extends LoadoutOperationResultBase {
  readonly equippedItem?: BaseSlotableInstance;
  readonly displacedItem?: BaseSlotableInstance;
  readonly slot?: UniversalSlotTypeKey;
}

// ── Unequip ──────────────────────────────────────────────────────────────────

export interface UnequipSlotRequest {
  readonly slot: UniversalSlotTypeKey;
}

export interface UnequipSlotResult extends LoadoutOperationResultBase {
  readonly unequippedItem?: BaseSlotableInstance;
  readonly slot?: UniversalSlotTypeKey;
}

// ── Swap ─────────────────────────────────────────────────────────────────────

export interface SwapSlotsRequest {
  readonly slotA: UniversalSlotTypeKey;
  readonly slotB: UniversalSlotTypeKey;
}

export interface SwapSlotsResult extends LoadoutOperationResultBase {
  readonly itemInSlotA?: BaseSlotableInstance;
  readonly itemInSlotB?: BaseSlotableInstance;
}

// ── Grant ────────────────────────────────────────────────────────────────────

export interface GrantItemRequest {
  readonly catalogId: string;
  readonly source: string;
  readonly overrides?: Partial<BaseSlotableInstance>;
}

export interface GrantItemResult extends LoadoutOperationResultBase {
  readonly item?: BaseSlotableInstance;
}

// ── Remove ───────────────────────────────────────────────────────────────────

export interface RemoveItemRequest {
  readonly itemGuid: string;
  readonly reason: string;
}

export interface RemoveItemResult extends LoadoutOperationResultBase {
  readonly removedItem?: BaseSlotableInstance;
}

// ── Activate (Consumables) ───────────────────────────────────────────────────

export interface ActivateSlotRequest {
  readonly slot: UniversalSlotTypeKey;
}

export interface ActivateSlotResult extends LoadoutOperationResultBase {
  readonly consumed?: boolean;
  readonly remainingQuantity?: number;
  readonly cooldownSec?: number;
}

// ── Sync Payloads ────────────────────────────────────────────────────────────

export interface UnifiedInventorySyncPayload {
  readonly snapshot: UnifiedInventorySnapshot;
  readonly unlockedSlots: readonly UniversalSlotTypeKey[];
}

export interface SlotUpdatePayload {
  readonly slot: UniversalSlotTypeKey;
  readonly category: SlotCategoryKey;
  readonly item: BaseSlotableInstance | undefined;
  readonly previousItem?: BaseSlotableInstance;
}

// ── Discriminators ───────────────────────────────────────────────────────────

export type AnyLoadoutOperationResult =
  | EquipItemResult
  | UnequipSlotResult
  | SwapSlotsResult
  | GrantItemResult
  | RemoveItemResult
  | ActivateSlotResult;

export type LoadoutOperationType =
  | "equip"
  | "unequip"
  | "swap"
  | "grant"
  | "remove"
  | "activate";
