// ─── @trembus/stats — Public API ──────────────────────────────────────────────

// ── Stat Keys & Arrays ──────────────────────────────────────────────────────

export {
	PRIMARY_ATTRIBUTE_KEYS,
	DERIVED_STAT_KEYS,
	MASTER_STAT_KEYS,
} from "./types";

// ── Types ───────────────────────────────────────────────────────────────────

export type {
	PrimaryAttributeKey,
	DerivedStatKey,
	MasterStatKey,
	PrimaryAttributes,
	DerivedStats,
	FinalStats,
	StatModifierMap,
	ModifierSource,
	DerivationFormula,
	DerivationConfig,
	ResourcePoolState,
} from "./types";

// ── Defaults ────────────────────────────────────────────────────────────────

export { DEFAULT_BASE_ATTRIBUTES, DEFAULT_DERIVATION_CONFIG } from "./defaults";

// ── Calculator ──────────────────────────────────────────────────────────────

export {
	calculateFinalStats,
	createModifierSource,
	mergeModifiers,
	applyAttributeModifiers,
	deriveStats,
	applyDerivedModifiers,
} from "./calculator";

// ── Resource Pools ──────────────────────────────────────────────────────────

export { ResourcePool, ResourcePoolSet } from "./resource-pool";

// ── Persistence ─────────────────────────────────────────────────────────────

export type { StatsSliceData } from "./persistence";
export {
	STATS_PERSISTENCE_SLICE,
	allocateAttributePoint,
	respecAttributes,
	totalAllocatedPoints,
} from "./persistence";
