// ─── Slotable Items: Consumable Domain ────────────────────────────────────────
import type { StatModifiers } from './types';
import type { BaseSlotableCatalogEntry, BaseSlotableInstance, Stackable } from './base-types';
import type { PassiveEffectConfig } from './equipment-types';
import type { ConsumableSlotKey } from './slot-types';

// ── Instant Effects ──────────────────────────────────────────────────────────

export type InstantEffectType =
  | "RestoreHealth"
  | "RestoreResource"
  | "DealDamage"
  | "Teleport"
  | "Reveal"
  | "Cleanse";

export interface InstantEffectConfig {
  readonly type: InstantEffectType;
  readonly magnitude: number;
  readonly isPercentage?: boolean;
  readonly delaySec?: number;
  readonly targetLocation?: "Spawn" | "Waypoint" | "LastSafePoint";
}

// ── Temporary Buffs ──────────────────────────────────────────────────────────

export interface TemporaryBuffConfig {
  readonly buffId: string;
  readonly durationSec: number;
  readonly modifiers?: StatModifiers;
  readonly passiveEffects?: readonly PassiveEffectConfig[];
  readonly stackable?: boolean;
  readonly maxStacks?: number;
  readonly refreshOnReuse?: boolean;
}

// ── Consumable Catalog Entry ─────────────────────────────────────────────────

export interface ConsumableCatalogEntry extends BaseSlotableCatalogEntry, Stackable {
  readonly slotCategory: "Consumable";
  readonly maxStackSize: number;
  readonly cooldownSec: number;
  readonly cooldownGroup?: string;
  readonly instantEffects?: readonly InstantEffectConfig[];
  readonly temporaryBuffs?: readonly TemporaryBuffConfig[];
  readonly useAnimationId?: string;
  readonly useSoundId?: string;
  readonly usableInCombat?: boolean;
  readonly usableWhileMoving?: boolean;
  readonly consumableCategory?: "Potion" | "Food" | "Scroll" | "Bomb" | "Utility";
}

// ── Consumable Instance ──────────────────────────────────────────────────────

export interface ConsumableItemInstance extends BaseSlotableInstance {
  readonly slotCategory: "Consumable";
  quantity: number;
  readonly consumableId: string;
}

// ── Consumable Loadout ───────────────────────────────────────────────────────

export type ConsumableLoadout = {
  readonly [Key in ConsumableSlotKey]?: ConsumableItemInstance;
};

export const DEFAULT_CONSUMABLE_LOADOUT: ConsumableLoadout = {
  Consumable1: undefined,
  Consumable2: undefined,
  Consumable3: undefined,
};

// ── Factory ──────────────────────────────────────────────────────────────────

export function createConsumableInstance(
  catalogEntry: ConsumableCatalogEntry,
  guid: string,
  ownerUserId: number,
  quantity: number = 1,
): ConsumableItemInstance {
  return {
    guid,
    catalogId: catalogEntry.id,
    slotCategory: "Consumable",
    quantity: math.clamp(quantity, 1, catalogEntry.maxStackSize),
    consumableId: catalogEntry.id,
    acquiredAt: os.time(),
    ownerUserId,
    isNew: true,
  };
}

// ── Stack Management ─────────────────────────────────────────────────────────

export function addToConsumableStack(
  instance: ConsumableItemInstance,
  amount: number,
  maxStackSize: number,
): number {
  const newQuantity = instance.quantity + amount;
  const overflow = math.max(0, newQuantity - maxStackSize);
  instance.quantity = math.min(newQuantity, maxStackSize);
  return overflow;
}

export function removeFromConsumableStack(
  instance: ConsumableItemInstance,
  amount: number = 1,
): boolean {
  if (instance.quantity < amount) return false;
  instance.quantity -= amount;
  return true;
}
