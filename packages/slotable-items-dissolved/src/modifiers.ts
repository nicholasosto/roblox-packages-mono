// ─── Slotable Items: Modifier Projection ──────────────────────────────────────
//
// Aggregates every equipped item's stat contributions (and PassiveGranting passives)
// into one projected result. Pure + synchronous → safe on client and server. Each kind's
// `contributeModifiers` (item-kind-registry) supplies the per-item contributions, so a
// game-registered kind plugs into projection with ZERO package edits.
//
// Stacking model:
//   • additive within/across scopes:  all "add" contributions for a stat sum.
//   • multiplicative across scopes:    "mul" contributions sum WITHIN a scope, then each
//                                       scope's (1 + sum) multiplies across scopes.
//   • mutually-exclusive:              within an exclusiveGroup only the highest-value
//                                       contribution survives (the rest are dropped first).

import type { UnifiedInventorySnapshot } from "./inventory";
import type { BaseSlotableCatalogEntry, PassiveGranting } from "./base-types";
import type { ActiveModifiers, ModifierContribution } from "./modifier-types";
import type { PassiveEffectConfig } from "./equipment-types";
import { getCatalogEntry } from "./catalog-store";
import { getKindForCategory } from "./item-kind-registry";

export function computeActiveModifiers(
  snapshot: UnifiedInventorySnapshot,
  resolveCatalog?: (id: string) => BaseSlotableCatalogEntry | undefined,
): ActiveModifiers {
  const resolve = resolveCatalog ?? getCatalogEntry;
  const contributions: ModifierContribution[] = [];
  const passives: PassiveEffectConfig[] = [];

  for (const [, bucket] of pairs(snapshot.loadout)) {
    for (const [, item] of pairs(bucket)) {
      if (item === undefined) continue;
      const entry = resolve(item.catalogId);
      if (entry === undefined) continue;
      const kind = getKindForCategory(item.slotCategory);
      if (kind === undefined) continue;

      if (kind.contributeModifiers !== undefined) {
        for (const c of kind.contributeModifiers(item, entry)) contributions.push(c);
      }

      // Collect passives only from kinds that declare PassiveGranting — for those kinds
      // `passiveEffects` is a PassiveEffectConfig[]. (SoulGem's rich configs are a
      // different shape and are handled by the game's combat layer.)
      if (kind.capabilities !== undefined && kind.capabilities.includes("PassiveGranting")) {
        const pe = (entry as Partial<PassiveGranting>).passiveEffects;
        if (pe !== undefined) for (const p of pe) passives.push(p);
      }
    }
  }

  return foldContributions(contributions, passives);
}

function foldContributions(
  all: readonly ModifierContribution[],
  passives: readonly PassiveEffectConfig[],
): ActiveModifiers {
  // 1. Exclusivity: keep only the highest-value contribution per exclusiveGroup.
  const survivors: ModifierContribution[] = [];
  const bestByGroup = new Map<string, ModifierContribution>();
  for (const c of all) {
    if (c.exclusiveGroup === undefined) {
      survivors.push(c);
      continue;
    }
    const cur = bestByGroup.get(c.exclusiveGroup);
    if (cur === undefined || c.value > cur.value) bestByGroup.set(c.exclusiveGroup, c);
  }
  for (const [, c] of bestByGroup) survivors.push(c);

  // 2. Additive totals (all scopes) + per-scope mul sums + provenance.
  const addTotal = new Map<string, number>();
  const mulByStat = new Map<string, Map<string, number>>(); // stat → (scope → sum of muls)
  const sourcesByStat = new Map<string, string[]>();
  const allStats = new Set<string>();

  for (const c of survivors) {
    allStats.add(c.stat);
    const srcs = sourcesByStat.get(c.stat) ?? [];
    srcs.push(c.sourceGuid);
    sourcesByStat.set(c.stat, srcs);

    if (c.op === "add") {
      addTotal.set(c.stat, (addTotal.get(c.stat) ?? 0) + c.value);
    } else {
      let scopeMap = mulByStat.get(c.stat);
      if (scopeMap === undefined) {
        scopeMap = new Map<string, number>();
        mulByStat.set(c.stat, scopeMap);
      }
      scopeMap.set(c.scope, (scopeMap.get(c.scope) ?? 0) + c.value);
    }
  }

  // 3. Combine: final = additive × Π_scope(1 + scopeMulSum).
  const additive: Record<string, number> = {};
  const multipliers: Record<string, number> = {};
  const stats: Record<string, number> = {};
  const bySource: Record<string, readonly string[]> = {};

  for (const stat of allStats) {
    const base = addTotal.get(stat) ?? 0;
    let mult = 1;
    const scopeMap = mulByStat.get(stat);
    if (scopeMap !== undefined) {
      for (const [, sum] of scopeMap) mult *= 1 + sum;
    }
    additive[stat] = base;
    multipliers[stat] = mult;
    stats[stat] = base * mult;
    bySource[stat] = sourcesByStat.get(stat) ?? [];
  }

  return { additive, multipliers, stats, passives, bySource };
}

/**
 * A cheap signature of the equipped loadout (sorted equipped guids + quantities). Consumers
 * memoize `computeActiveModifiers` against this and recompute only when it changes
 * (cache-on-signal). The function itself ships no cache (no shared module state).
 */
export function loadoutSignature(snapshot: UnifiedInventorySnapshot): string {
  const parts: string[] = [];
  for (const [cat, bucket] of pairs(snapshot.loadout)) {
    for (const [slot, item] of pairs(bucket)) {
      if (item !== undefined) parts.push(`${cat}:${slot}:${item.guid}:${item.quantity}`);
    }
  }
  parts.sort();
  return parts.join("|");
}
