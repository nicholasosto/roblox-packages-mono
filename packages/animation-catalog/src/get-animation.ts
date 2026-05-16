// ─── @trembus/animation-catalog: Logical-Name Resolver ──────────────────────

import type { AnimationCatalogEntry } from "./types";
import { Animations } from "./catalog";

/**
 * Resolve a dotted logical name to its catalog entry.
 *
 * Game code that doesn't have a typed reference handy (e.g. an
 * `AbilityCatalogEntry.animationId` string field) calls this to fetch the entry.
 *
 * @example
 *   const entry = getAnimation("combat.melee.punchLeft");
 *   if (entry?.status === "READY") {
 *     animation.AnimationId = entry.assetId;
 *   }
 */
export function getAnimation(logicalName: string): AnimationCatalogEntry | undefined {
  const segments = logicalName.split(".");
  let cursor: unknown = Animations;
  for (const segment of segments) {
    if (cursor === undefined || typeOf(cursor) !== "table") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (cursor === undefined || typeOf(cursor) !== "table") return undefined;
  // A catalog entry has an `assetId` field; intermediate branches don't.
  if (typeOf((cursor as { assetId?: unknown }).assetId) !== "string") return undefined;
  return cursor as AnimationCatalogEntry;
}
