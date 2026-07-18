// ─── Slotable Items: Modifier Projection Types (leaf) ─────────────────────────
//
// Types for the modifier-aggregation layer (see modifiers.ts). Kept in a leaf module
// so the item-kind registry can reference `ModifierContribution` in its descriptor
// without importing the projection implementation (avoids a load cycle).

import type { PassiveEffectConfig } from "./equipment-types";

/** How a single contribution combines: "add" = flat additive, "mul" = percentage (0.1 = +10%). */
export type ModifierOp = "add" | "mul";

/**
 * One item's contribution to one stat. The unit the projection aggregates.
 * - `scope` groups "mul" contributions: muls in the SAME scope add together, then each
 *   scope's net multiplier applies multiplicatively across scopes.
 * - `exclusiveGroup` (optional): within a group only the single highest-`value`
 *   contribution survives — models "only your strongest aura of this type applies".
 */
export interface ModifierContribution {
  readonly stat: string;
  readonly value: number;
  readonly op: ModifierOp;
  readonly scope: string;
  readonly exclusiveGroup?: string;
  readonly sourceGuid: string;
}

/** The projected result of `computeActiveModifiers`. */
export interface ActiveModifiers {
  /** Sum of all "add" contributions per stat. */
  readonly additive: Readonly<Record<string, number>>;
  /** Product over scopes of (1 + sum of "mul" contributions in that scope); 1 = unchanged. */
  readonly multipliers: Readonly<Record<string, number>>;
  /** Convenience: `additive × multiplier` per stat. Use when the slotted items ARE the
   *  whole value; otherwise apply `additive`/`multipliers` to the game's own base. */
  readonly stats: Readonly<Record<string, number>>;
  /** Passive effects surfaced by kinds that declare the "PassiveGranting" capability. */
  readonly passives: readonly PassiveEffectConfig[];
  /** Provenance: stat → the source instance guids that contributed to it (for tooltips/debug). */
  readonly bySource: Readonly<Record<string, readonly string[]>>;
}

/** Soft, non-binding canonical scope names. Free strings are allowed (like StatModifiers);
 *  these exist only for discoverability/consistency. */
export const MODIFIER_SCOPES = {
  Equipment: "Equipment",
  Accessory: "Accessory",
  SoulGem: "SoulGem",
  Set: "Set",
  Buff: "Buff",
} as const;
