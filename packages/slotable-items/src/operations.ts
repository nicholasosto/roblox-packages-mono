// ─── Slotable Items: Network Operation Types ─────────────────────────────────
import type { UniversalSlotTypeKey, SlotCategoryKey } from './slot-types';
import type { AnySlotableInstance, UnifiedInventorySnapshot } from './inventory';

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
  readonly equippedItem?: AnySlotableInstance;
  readonly displacedItem?: AnySlotableInstance;
  readonly slot?: UniversalSlotTypeKey;
}

// ── Unequip ──────────────────────────────────────────────────────────────────

export interface UnequipSlotRequest {
  readonly slot: UniversalSlotTypeKey;
}

export interface UnequipSlotResult extends LoadoutOperationResultBase {
  readonly unequippedItem?: AnySlotableInstance;
  readonly slot?: UniversalSlotTypeKey;
}

// ── Swap ─────────────────────────────────────────────────────────────────────

export interface SwapSlotsRequest {
  readonly slotA: UniversalSlotTypeKey;
  readonly slotB: UniversalSlotTypeKey;
}

export interface SwapSlotsResult extends LoadoutOperationResultBase {
  readonly itemInSlotA?: AnySlotableInstance;
  readonly itemInSlotB?: AnySlotableInstance;
}

// ── Grant ────────────────────────────────────────────────────────────────────

export interface GrantItemRequest {
  readonly catalogId: string;
  readonly source: string;
  readonly overrides?: Partial<AnySlotableInstance>;
}

export interface GrantItemResult extends LoadoutOperationResultBase {
  readonly item?: AnySlotableInstance;
}

// ── Remove ───────────────────────────────────────────────────────────────────

export interface RemoveItemRequest {
  readonly itemGuid: string;
  readonly reason: string;
}

export interface RemoveItemResult extends LoadoutOperationResultBase {
  readonly removedItem?: AnySlotableInstance;
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
  readonly item: AnySlotableInstance | undefined;
  readonly previousItem?: AnySlotableInstance;
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
