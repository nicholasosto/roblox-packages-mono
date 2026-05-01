// ─── Stats: Pure Stat Calculation Pipeline ────────────────────────────────────
import { PRIMARY_ATTRIBUTE_KEYS, DERIVED_STAT_KEYS } from "./types";
import type {
	PrimaryAttributes,
	DerivedStats,
	FinalStats,
	StatModifierMap,
	ModifierSource,
	DerivationConfig,
	MasterStatKey,
} from "./types";
import { DEFAULT_DERIVATION_CONFIG } from "./defaults";

// ── Convenience Factory ─────────────────────────────────────────────────────

/** Create a named modifier source for the pipeline. */
export function createModifierSource(label: string, modifiers: StatModifierMap): ModifierSource {
	return { label, modifiers };
}

// ── Pipeline Building Blocks ────────────────────────────────────────────────

/**
 * Merge all modifier sources into a single flat map (additive sum).
 * Multiple sources with the same stat key stack additively.
 */
export function mergeModifiers(sources: readonly ModifierSource[]): StatModifierMap {
	const merged: StatModifierMap = {};

	for (const source of sources) {
		for (const [key, value] of pairs(source.modifiers as Record<string, number>)) {
			const statKey = key as MasterStatKey;
			const existing = (merged as Record<string, number>)[statKey as string] ?? 0;
			(merged as Record<string, number>)[statKey as string] = existing + value;
		}
	}

	return merged;
}

/**
 * Apply attribute-targeted modifiers to base attributes.
 * Only modifiers with keys matching PrimaryAttributeKey are applied.
 */
export function applyAttributeModifiers(
	base: PrimaryAttributes,
	merged: StatModifierMap,
): PrimaryAttributes {
	const result = { ...base };

	for (const key of PRIMARY_ATTRIBUTE_KEYS) {
		const bonus = (merged as Record<string, number>)[key as string] ?? 0;
		if (bonus !== 0) {
			result[key] += bonus;
		}
	}

	return result;
}

/**
 * Run derivation formulas on modified attributes to produce derived stats.
 * Accepts an optional partial override — missing entries fall back to defaults.
 */
export function deriveStats(
	attributes: PrimaryAttributes,
	level: number,
	configOverrides?: Partial<DerivationConfig>,
): DerivedStats {
	const result = {} as DerivedStats;

	for (const key of DERIVED_STAT_KEYS) {
		const formula = configOverrides?.[key] ?? DEFAULT_DERIVATION_CONFIG[key];
		result[key] = formula(attributes, level);
	}

	return result;
}

/**
 * Apply derived-stat-targeted modifiers on top of derived stats.
 * Only modifiers with keys matching DerivedStatKey are applied.
 */
export function applyDerivedModifiers(
	derived: DerivedStats,
	merged: StatModifierMap,
): DerivedStats {
	const result = { ...derived };

	for (const key of DERIVED_STAT_KEYS) {
		const bonus = (merged as Record<string, number>)[key as string] ?? 0;
		if (bonus !== 0) {
			result[key] += bonus;
		}
	}

	return result;
}

// ── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Calculate final stats from base attributes, level, and modifier sources.
 *
 * Pipeline:
 * 1. Merge all modifier sources (additive sum)
 * 2. Apply attribute-targeted bonuses to base attributes
 * 3. Derive combat stats from modified attributes via formulas
 * 4. Apply derived-stat-targeted bonuses on top
 * 5. Return combined FinalStats
 *
 * @param baseAttributes - Player's invested attribute points
 * @param level - Current player level (fed into derivation formulas)
 * @param modifierSources - Equipment, buffs, set bonuses, etc.
 * @param derivationOverrides - Optional partial formula overrides
 */
export function calculateFinalStats(
	baseAttributes: PrimaryAttributes,
	level: number,
	modifierSources: readonly ModifierSource[],
	derivationOverrides?: Partial<DerivationConfig>,
): FinalStats {
	// 1. Merge all modifiers into one flat map
	const merged = mergeModifiers(modifierSources);

	// 2. Apply attribute bonuses (e.g., +5 Strength from a sword)
	const modifiedAttributes = applyAttributeModifiers(baseAttributes, merged);

	// 3. Derive combat stats from modified attributes
	const derivedBase = deriveStats(modifiedAttributes, level, derivationOverrides);

	// 4. Apply direct derived-stat bonuses (e.g., +20 maxHealth from a ring)
	const finalDerived = applyDerivedModifiers(derivedBase, merged);

	// 5. Combine into FinalStats
	return {
		...modifiedAttributes,
		...finalDerived,
	} as FinalStats;
}
