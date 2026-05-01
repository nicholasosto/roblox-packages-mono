// ─── Stats: Default Formulas & Templates ──────────────────────────────────────
import type { PrimaryAttributes, DerivationConfig } from "./types";

// ── Default Base Attributes (Level 1 Baseline) ─────────────────────────────

export const DEFAULT_BASE_ATTRIBUTES: PrimaryAttributes = {
	Strength: 5,
	Agility: 5,
	Intellect: 5,
	Vitality: 5,
	Luck: 5,
};

// ── Default Derivation Formulas ─────────────────────────────────────────────

/**
 * Sensible RPG derivation formulas.
 * With default attributes (all 5s) at level 1, these produce:
 *   maxHealth ~= 100, maxMana ~= 63, attack ~= 11, critRate ~= 0.06
 *
 * Games override individual formulas via `Partial<DerivationConfig>`.
 */
export const DEFAULT_DERIVATION_CONFIG: DerivationConfig = {
	maxHealth: (attr, level) => 50 + attr.Vitality * 10 + level * 5,
	maxMana: (attr, level) => 20 + attr.Intellect * 8 + level * 3,
	maxStamina: (attr, level) => 40 + attr.Vitality * 5 + attr.Agility * 5 + level * 3,
	attack: (attr, level) => attr.Strength * 2 + level,
	defense: (attr, level) => attr.Vitality + attr.Strength * 0.5 + level * 0.5,
	speed: (attr) => 14 + attr.Agility * 0.4,
	critRate: (attr) => 0.02 + attr.Agility * 0.003 + attr.Luck * 0.005,
	critDamage: (attr) => 1.5 + attr.Luck * 0.02,
	healthRegen: (attr) => attr.Vitality * 0.5,
	manaRegen: (attr) => attr.Intellect * 0.3,
	staminaRegen: (attr) => attr.Agility * 0.4 + attr.Vitality * 0.2,
};
