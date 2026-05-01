// ─── Stats: Core Type Definitions ─────────────────────────────────────────────

// ── Primary Attribute Keys ──────────────────────────────────────────────────

export const PRIMARY_ATTRIBUTE_KEYS = [
	"Strength",
	"Agility",
	"Intellect",
	"Vitality",
	"Luck",
] as const;

export type PrimaryAttributeKey = (typeof PRIMARY_ATTRIBUTE_KEYS)[number];

// ── Derived Stat Keys ───────────────────────────────────────────────────────

export const DERIVED_STAT_KEYS = [
	"maxHealth",
	"maxMana",
	"maxStamina",
	"attack",
	"defense",
	"speed",
	"critRate",
	"critDamage",
	"healthRegen",
	"manaRegen",
	"staminaRegen",
] as const;

export type DerivedStatKey = (typeof DERIVED_STAT_KEYS)[number];

// ���─ Master Stat Key ─────────────────────────────────────────────────────────

/**
 * Union of all stat keys — both primary attributes and derived stats.
 * This is the canonical type that resolves the `string` keys used in
 * `StatModifiers` (slotable-items) and `ActiveEffects.statBonuses` (status-effects).
 *
 * Games cast at the boundary:
 *   `item.modifiers as StatModifierMap`
 */
export type MasterStatKey = PrimaryAttributeKey | DerivedStatKey;

export const MASTER_STAT_KEYS: readonly MasterStatKey[] = [
	...PRIMARY_ATTRIBUTE_KEYS,
	...DERIVED_STAT_KEYS,
];

// ── Stat Structures ─────────────────────────────────────────────────────────

/** Base investable attributes — grow via player allocation. */
export type PrimaryAttributes = Record<PrimaryAttributeKey, number>;

/** Computed combat stats — derived from attributes via formulas. */
export type DerivedStats = Record<DerivedStatKey, number>;

/** Complete stat sheet combining attributes and derived stats. */
export type FinalStats = PrimaryAttributes & DerivedStats;

// ── Modifier Types ──────────────────────────────────────────────────────────

/**
 * Partial stat modifier map — the bridge type for cross-package modifiers.
 * Items, buffs, and set bonuses all produce these.
 */
export type StatModifierMap = Partial<Record<MasterStatKey, number>>;

/** A named modifier source for the calculation pipeline. */
export interface ModifierSource {
	readonly label: string;
	readonly modifiers: StatModifierMap;
}

// ── Derivation Formula Types ────────────────────────────────────────────────

/** A function that computes one derived stat from attributes and level. */
export type DerivationFormula = (attributes: PrimaryAttributes, level: number) => number;

/** Complete formula set — one formula per derived stat. */
export type DerivationConfig = Record<DerivedStatKey, DerivationFormula>;

// ── Resource Pool Types ─────────────────────────────────────────────────────

/** Read-only snapshot of a resource pool — for networking/UI. */
export interface ResourcePoolState {
	readonly current: number;
	readonly max: number;
	readonly regenPerSecond: number;
}
