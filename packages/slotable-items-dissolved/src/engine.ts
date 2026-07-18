// ─── Slotable Items: Reference Inventory Engine ───────────────────────────────
//
// The implementations behind the contract-only operations.ts. Every executor is PURE
// and SYNCHRONOUS so it can run inside a ProfileStore `modifyProfile(player, mutator)`
// whose mutator must not yield. Executors MUTATE A DRAFT in place and are ALL-OR-NOTHING:
// on any failure the draft is left untouched (nothing wrong to persist) and a
// failure-as-data result is returned — they never throw.
//
// Server integration (the wrap pattern; the executors are not Roblox-aware):
//
//   let result: EquipItemResult = { success: false, reason: "ProfileNotLoaded" };
//   const wrote = dataService.modifyProfile(player, (data) => {
//     const draft = data.inventory as unknown as InventoryDraft;   // live snapshot
//     result = equipItem(draft, req, { playerLevel, ownerUserId: player.UserId });
//   });
//   if (!wrote) result = { success: false, reason: "ProfileNotLoaded" };
//
// For client optimistic preview use `preview(executor, snapshot, req, ctx)` — it clones
// the snapshot first so nothing real is mutated.

import type { UnifiedLoadout, UnifiedInventorySnapshot } from "./inventory";
import { findItemByGuid } from "./inventory";
import type { BaseSlotableInstance, BaseSlotableCatalogEntry } from "./base-types";
import { canItemFitInSlot } from "./base-types";
import type { EquipmentSlotKey } from "./slot-types";
import type { AbilityItemInstance } from "./ability-types";
import { getCategoryForSlot, getRegisteredCategory } from "./slot-category-registry";
import { getCatalogEntry } from "./catalog-store";
import { getKindForCategory, createInstanceForEntry } from "./item-kind-registry";
import type {
  EquipItemRequest, EquipItemResult,
  UnequipSlotRequest, UnequipSlotResult,
  SwapSlotsRequest, SwapSlotsResult,
  GrantItemRequest, GrantItemResult,
  RemoveItemRequest, RemoveItemResult,
  ActivateSlotRequest, ActivateSlotResult,
  LoadoutOperationFailureReason,
} from "./operations";

// ── Draft & Context ────────────────────────────────────────────────────────────

/** A mutable view of the snapshot the engine writes into (same shape, mutable arrays). */
export interface InventoryDraft {
  loadout: UnifiedLoadout;
  backpack: BaseSlotableInstance[];
  learnedAbilities: AbilityItemInstance[];
  backpackCapacity: number;
}

/** Everything an executor needs beyond the draft. `resolveCatalog` defaults to the
 *  package catalog registry; `newGuid` defaults to a deterministic in-process counter. */
export interface EngineContext {
  readonly playerLevel: number;
  readonly ownerUserId: number;
  readonly resolveCatalog?: (id: string) => BaseSlotableCatalogEntry | undefined;
  readonly newGuid?: () => string;
}

let _guidCounter = 0;
function defaultGuid(): string {
  _guidCounter += 1;
  return `sl-inst-${_guidCounter}`;
}

// ── Internal helpers ────────────────────────────────────────────────────────────

function ensureBucket(draft: InventoryDraft, category: string): { [slotKey: string]: BaseSlotableInstance | undefined } {
  let bucket = draft.loadout[category];
  if (bucket === undefined) {
    bucket = {};
    draft.loadout[category] = bucket;
  }
  return bucket;
}

/** The single equip-legality gate, shared by equip + swap. Returns the failure reason,
 *  or undefined when the item may legally occupy `targetSlot`. */
function checkEquipLegality(
  inst: BaseSlotableInstance,
  targetSlot: string,
  ctx: EngineContext,
  resolve: (id: string) => BaseSlotableCatalogEntry | undefined,
): LoadoutOperationFailureReason | undefined {
  if (inst.ownerUserId !== ctx.ownerUserId) return "OwnershipMismatch";

  const entry = resolve(inst.catalogId);
  if (entry === undefined) return "CatalogMissing";
  if (entry.requiredLevel !== undefined && ctx.playerLevel < entry.requiredLevel) return "LevelTooLow";
  if (inst.isLocked === true) return "ItemLocked";

  const targetCategory = getCategoryForSlot(targetSlot);
  if (targetCategory === undefined) return "SlotTypeInvalid";
  if (targetCategory !== inst.slotCategory) return "IncompatibleSlot";

  // Level-gated slot unlock — generalizes getUnlockedSoulGemSlots to any category
  // whose descriptor declares a slotUnlock(playerLevel) function.
  const desc = getRegisteredCategory(targetCategory);
  if (desc !== undefined && desc.slotUnlock !== undefined) {
    const unlocked = desc.slotUnlock(ctx.playerLevel);
    if (!unlocked.includes(targetSlot)) return "SlotLocked";
  }

  // Strict-slot compatibility (Equipment: Head → Head). canItemFitInSlot returns true
  // for any-in-category kinds and for kinds without an equipment-slot concept.
  const itemEquipmentSlot =
    "equipmentSlot" in inst ? ((inst as { equipmentSlot?: string }).equipmentSlot as EquipmentSlotKey | undefined) : undefined;
  if (!canItemFitInSlot(inst.slotCategory, itemEquipmentSlot, targetCategory, targetSlot as EquipmentSlotKey)) {
    return "IncompatibleSlot";
  }

  return undefined;
}

// ── Executors ──────────────────────────────────────────────────────────────────

export function equipItem(draft: InventoryDraft, req: EquipItemRequest, ctx: EngineContext): EquipItemResult {
  const resolve = ctx.resolveCatalog ?? getCatalogEntry;

  const idx = draft.backpack.findIndex((it) => it.guid === req.itemGuid);
  if (idx === -1) return { success: false, reason: "ItemNotInInventory" };
  const inst = draft.backpack[idx];

  const legality = checkEquipLegality(inst, req.targetSlot, ctx, resolve);
  if (legality !== undefined) return { success: false, reason: legality };

  const bucket = ensureBucket(draft, inst.slotCategory);
  const displaced = bucket[req.targetSlot];

  // Equip never overflows the backpack (the item leaves it; the displaced item, if any,
  // returns to it — net change ≤ 0). Commit:
  bucket[req.targetSlot] = inst;
  draft.backpack.remove(idx);
  if (displaced !== undefined) draft.backpack.push(displaced);

  return { success: true, equippedItem: inst, displacedItem: displaced, slot: req.targetSlot };
}

export function unequipSlot(draft: InventoryDraft, req: UnequipSlotRequest, _ctx: EngineContext): UnequipSlotResult {
  const category = getCategoryForSlot(req.slot);
  if (category === undefined) return { success: false, reason: "SlotTypeInvalid" };

  const bucket = draft.loadout[category];
  const item = bucket !== undefined ? bucket[req.slot] : undefined;
  if (item === undefined) return { success: false, reason: "SlotEmpty" };

  if (draft.backpack.size() >= draft.backpackCapacity) return { success: false, reason: "BackpackFull" };

  bucket![req.slot] = undefined;
  draft.backpack.push(item);
  return { success: true, unequippedItem: item, slot: req.slot };
}

export function swapSlots(draft: InventoryDraft, req: SwapSlotsRequest, ctx: EngineContext): SwapSlotsResult {
  if (req.slotA === req.slotB) return { success: false, reason: "SameSlot" };
  const resolve = ctx.resolveCatalog ?? getCatalogEntry;

  const catA = getCategoryForSlot(req.slotA);
  const catB = getCategoryForSlot(req.slotB);
  if (catA === undefined || catB === undefined) return { success: false, reason: "SlotTypeInvalid" };

  const itemA = draft.loadout[catA]?.[req.slotA];
  const itemB = draft.loadout[catB]?.[req.slotB];
  if (itemA === undefined && itemB === undefined) return { success: false, reason: "SlotEmpty" };

  // Each occupant must be legal in the OTHER slot (rejects cross-category swaps).
  if (itemA !== undefined) {
    const r = checkEquipLegality(itemA, req.slotB, ctx, resolve);
    if (r !== undefined) return { success: false, reason: r };
  }
  if (itemB !== undefined) {
    const r = checkEquipLegality(itemB, req.slotA, ctx, resolve);
    if (r !== undefined) return { success: false, reason: r };
  }

  const bucketA = ensureBucket(draft, catA);
  const bucketB = ensureBucket(draft, catB);
  bucketA[req.slotA] = itemB;
  bucketB[req.slotB] = itemA;
  return { success: true, itemInSlotA: itemB, itemInSlotB: itemA };
}

export function grantItem(draft: InventoryDraft, req: GrantItemRequest, ctx: EngineContext): GrantItemResult {
  const resolve = ctx.resolveCatalog ?? getCatalogEntry;
  const entry = resolve(req.catalogId);
  if (entry === undefined) return { success: false, reason: "CatalogMissing" };

  const kind = getKindForCategory(entry.slotCategory);

  // Auto-merge into an existing partial stack for stackable kinds.
  if (kind !== undefined && kind.stacking !== undefined) {
    const maxStack = kind.stacking.maxStackSize;
    for (const it of draft.backpack) {
      if (it.catalogId === req.catalogId && it.quantity < maxStack) {
        it.quantity += 1;
        return { success: true, item: it };
      }
    }
  }

  const guid = (ctx.newGuid ?? defaultGuid)();
  const inst = createInstanceForEntry(entry, guid, ctx.ownerUserId);
  if (inst === undefined) return { success: false, reason: "CatalogMissing" };
  if (req.overrides !== undefined) applyOverrides(inst, req.overrides);

  if (draft.backpack.size() >= draft.backpackCapacity) return { success: false, reason: "BackpackFull" };
  draft.backpack.push(inst);
  return { success: true, item: inst };
}

export function removeItem(draft: InventoryDraft, req: RemoveItemRequest, _ctx: EngineContext): RemoveItemResult {
  const bi = draft.backpack.findIndex((it) => it.guid === req.itemGuid);
  if (bi !== -1) {
    const removed = draft.backpack[bi];
    draft.backpack.remove(bi);
    return { success: true, removedItem: removed };
  }

  const li = draft.learnedAbilities.findIndex((it) => it.guid === req.itemGuid);
  if (li !== -1) {
    const removed = draft.learnedAbilities[li];
    draft.learnedAbilities.remove(li);
    return { success: true, removedItem: removed };
  }

  for (const [, bucket] of pairs(draft.loadout)) {
    for (const [slot, item] of pairs(bucket)) {
      if (item !== undefined && item.guid === req.itemGuid) {
        bucket[slot as string] = undefined;
        return { success: true, removedItem: item };
      }
    }
  }

  return { success: false, reason: "ItemNotInInventory" };
}

export function activateSlot(draft: InventoryDraft, req: ActivateSlotRequest, ctx: EngineContext): ActivateSlotResult {
  const resolve = ctx.resolveCatalog ?? getCatalogEntry;
  const category = getCategoryForSlot(req.slot);
  if (category === undefined) return { success: false, reason: "SlotTypeInvalid" };

  const bucket = draft.loadout[category];
  const item = bucket !== undefined ? bucket[req.slot] : undefined;
  if (item === undefined) return { success: false, reason: "SlotEmpty" };

  const entry = resolve(item.catalogId);
  const cooldownSec = entry !== undefined ? (entry as { cooldownSec?: number }).cooldownSec : undefined;

  // The engine reports consumption + cooldown; it never applies the consumable's gameplay
  // effect (healing, buffs) — that stays in the game's combat layer. Keeps the engine pure.
  const remaining = item.quantity - 1;
  if (remaining <= 0) {
    bucket![req.slot] = undefined;
    return { success: true, consumed: true, remainingQuantity: 0, cooldownSec };
  }
  item.quantity = remaining;
  return { success: true, consumed: true, remainingQuantity: remaining, cooldownSec };
}

function applyOverrides(inst: BaseSlotableInstance, overrides: Partial<BaseSlotableInstance>): void {
  for (const [k, v] of pairs(overrides as unknown as Map<string, unknown>)) {
    if (v !== undefined) (inst as unknown as Record<string, unknown>)[k as string] = v;
  }
}

// ── Pure preview (client optimistic UI) ──────────────────────────────────────────

function deepClone<T>(value: T): T {
  if (!typeIs(value, "table")) return value;
  const out: Record<string | number, unknown> = {};
  for (const [k, v] of pairs(value as unknown as Map<unknown, unknown>)) {
    out[k as string | number] = deepClone(v);
  }
  return out as unknown as T;
}

/** Deep-clone a snapshot (safe: snapshots are metatable-free plain tables by constraint). */
export function cloneSnapshot(snapshot: UnifiedInventorySnapshot): UnifiedInventorySnapshot {
  return deepClone(snapshot);
}

/**
 * Run any executor against a CLONE of the snapshot, leaving the original untouched.
 * For client-side optimistic preview; the server always uses the mutating executors
 * inside modifyProfile.
 */
export function preview<TReq, TRes>(
  executor: (draft: InventoryDraft, req: TReq, ctx: EngineContext) => TRes,
  snapshot: UnifiedInventorySnapshot,
  req: TReq,
  ctx: EngineContext,
): { snapshot: UnifiedInventorySnapshot; result: TRes } {
  const clone = cloneSnapshot(snapshot);
  const draft = clone as unknown as InventoryDraft;
  const result = executor(draft, req, ctx);
  return { snapshot: clone, result };
}

// Re-export for callers that locate an item before acting (e.g. building an EquipRequest).
export { findItemByGuid };
