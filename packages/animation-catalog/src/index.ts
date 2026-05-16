// ─── @trembus/animation-catalog: Barrel Exports ─────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────
export {
  type AnimationCatalogEntry,
  type AnimationStatus,
  type RigCompat,
  type Domain,
  type AnimSub,
  type AnimationPriority,
} from "./types";

// ── Generated Catalog ────────────────────────────────────────────────────────
export { Animations } from "./catalog";

// ── Resolver ─────────────────────────────────────────────────────────────────
export { getAnimation } from "./get-animation";
