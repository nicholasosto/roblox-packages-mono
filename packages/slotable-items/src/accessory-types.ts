// ─── Slotable Items: Accessory Domain ─────────────────────────────────────────
import type { BaseSlotableCatalogEntry, BaseSlotableInstance, StatModifiable, PassiveGranting, AbilityGranting } from './base-types';
import type { AccessorySlotKey } from './slot-types';

// ── Accessory Classification ─────────────────────────────────────────────────

export type AccessoryType = "Ring" | "Amulet" | "Cape" | "Trinket" | "Belt" | "Earring";

// ── Accessory Catalog Entry ──────────────────────────────────────────────────

export interface AccessoryCatalogEntry
  extends BaseSlotableCatalogEntry,
    StatModifiable,
    Partial<PassiveGranting>,
    Partial<AbilityGranting>
{
  readonly slotCategory: "Accessory";
  readonly accessoryType: AccessoryType;
  readonly setId?: string;
  readonly attachmentAssetId?: string;
}

// ── Accessory Instance ───────────────────────────────────────────────────────

export interface AccessoryItemInstance extends BaseSlotableInstance {
  readonly slotCategory: "Accessory";
  readonly quantity: 1;
  readonly accessoryType: AccessoryType;
}

// ── Accessory Loadout ────────────────────────────────────────────────────────

export type AccessoryLoadout = {
  readonly [Key in AccessorySlotKey]?: AccessoryItemInstance;
};

export const DEFAULT_ACCESSORY_LOADOUT: AccessoryLoadout = {
  Accessory1: undefined,
  Accessory2: undefined,
};

// ── Factory ──────────────────────────────────────────────────────────────────

export function createAccessoryInstance(
  catalogEntry: AccessoryCatalogEntry,
  guid: string,
  ownerUserId: number,
): AccessoryItemInstance {
  return {
    guid,
    catalogId: catalogEntry.id,
    slotCategory: "Accessory",
    quantity: 1,
    accessoryType: catalogEntry.accessoryType,
    acquiredAt: os.time(),
    ownerUserId,
    isNew: true,
  };
}
