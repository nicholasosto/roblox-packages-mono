// ─── @trembus/rbx-ui: Game UI Type Definitions ────────────────────────────────
// Extracted from testing environment mock-data — these are the canonical types
// for game UI components. Mock data stays in consuming projects.

// ── Combat ─────────────────────────────────────────────────

export interface ResourceData {
	id: string;
	label: string;
	current: number;
	max: number;
	color: "health" | "mana" | "stamina";
}

export interface AbilityData {
	id: string;
	name: string;
	keybind: string;
	cooldown: number;
	maxCooldown: number;
	icon: string;
}

export interface CombatEntityData {
	name: string;
	level: number;
	resources: ResourceData[];
}

export interface DamagePopup {
	id: string;
	value: number;
	type: "damage" | "heal";
}

// ── Character ──────────────────────────────────────────────

export interface CharacterStat {
	id: string;
	label: string;
	base: number;
	allocated: number;
}

export interface DerivedStat {
	id: string;
	label: string;
	value: string;
}

export interface CharacterData {
	name: string;
	className: string;
	domain: string;
	level: number;
	xp: number;
	xpToNext: number;
	availablePoints: number;
	stats: CharacterStat[];
	derived: DerivedStat[];
}

// ── Inventory ──────────────────────────────────────────────

export type ItemRarity = "common" | "uncommon" | "rare" | "epic";
export type ItemCategory = "equipment" | "consumable" | "material";

export interface ItemData {
	id: string;
	name: string;
	rarity: ItemRarity;
	category: ItemCategory;
	icon: string;
	stackCount: number;
	description: string;
	stats?: { label: string; value: string }[];
	equippable?: boolean;
}

export const RARITY_COLORS: Record<ItemRarity, { r: number; g: number; b: number }> = {
	common: { r: 138, g: 155, b: 176 },
	uncommon: { r: 74, g: 222, b: 128 },
	rare: { r: 96, g: 165, b: 250 },
	epic: { r: 192, g: 132, b: 252 },
};
