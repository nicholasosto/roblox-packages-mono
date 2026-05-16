// ─── @trembus/animation-catalog: Hand-Curated Overrides ─────────────────────
//
// This file holds the metadata that humans decide — what an animation MEANS
// in product terms. The codegen script reads it and merges with CSV/ledger
// data when emitting `catalog.ts`. The codegen script NEVER overwrites entries
// in this file; it only adds new ones (commented out, awaiting human decision).
//
// Override schema (per assetId):
//   {
//     logicalName: "combat.melee.punchLeft",  // dotted path into the catalog tree
//     sub: "CMB",                              // SUB code from taxonomy.yaml v1.3.0
//     domain: "shared",                        // owning domain (default: "shared")
//     priority: "Action",                      // animation priority (default: "Core")
//     tags: ["steel-city-m3"],                // optional cross-cutting tags
//     notes: "Reused from older Combat_Punch_2026 upload",  // optional
//   }
//
// Add an entry here for each animation you want to surface in the typed catalog.
// Fields you DON'T set (assetId, tglName, lengthSec, looped, status, compatibleRigs)
// come from the CSV + triage ledger and are filled by the codegen script.

import type { AnimSub, AnimationPriority, Domain } from "./types";

export interface AnimationOverride {
  readonly logicalName: string;
  readonly sub: AnimSub;
  readonly domain?: Domain;
  readonly priority?: AnimationPriority;
  readonly tags?: readonly string[];
  readonly notes?: string;
}

/**
 * Map from asset ID (numeric string, no `rbxassetid://` prefix) to overrides.
 *
 * Populated incrementally as animations are triaged and given logical names.
 * Initial state is empty; entries are added per the Steel City priority order:
 *   M2 unblock first: SS_NPC_*, SS_Combat_*, MOVE_*
 *   M3 unblock next:  Ability Melee *, Combat Punch 2026, SS_BIG_DODGE
 *   M4 next:          Transformation_*
 *   Future-domain:    BasicSkill_*, Ki/Kamehameha-family
 */
export const overrides: Readonly<Record<string, AnimationOverride>> = {
  // Example (commented — fill in as the triage ledger generates real data):
  //
  // "139880766788985": {
  //   logicalName: "npc.chase",
  //   sub: "NPC",
  //   domain: "shared",
  //   priority: "Movement",
  //   tags: ["steel-city-m2"],
  //   notes: "Trembus SS_NPC_Chase upload, repurposed across all enemy rigs",
  // },
};

/**
 * Asset IDs to ignore in catalog generation. Use sparingly — typically only for
 * animations that have been retired or replaced but still appear in the master CSV.
 */
export const IGNORE_LIST: readonly string[] = [];
