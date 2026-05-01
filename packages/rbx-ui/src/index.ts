// ─── @trembus/rbx-ui: Barrel Exports ───────────────────────────────────────
// Roblox React UI component library

// Types
export type {
	ResourceData,
	AbilityData,
	CombatEntityData,
	DamagePopup,
	CharacterStat,
	DerivedStat,
	CharacterData,
	ItemRarity,
	ItemCategory,
	ItemData,
} from "./types";
export { RARITY_COLORS } from "./types";

// Design System
export {
	BG, BORDER, AMBER, TACTICAL, SIGNAL, INTEL, PURPLE, STAT, TEXT,
	FONTS, FONT_SIZE, SPACING, RADII,
	INTENT_COLORS, withAlpha,
	STATUS_INTENT_MAP, getIntent,
} from "./design-system";
export type { ColorIntent, IntentColors } from "./design-system";

// Components — Atoms
export { StatusBadge, ResourceBar, AbilitySlot, ItemSlot } from "./components";

// Components — Molecules
export { PlayerFrame, TargetFrame, ControllerCard } from "./components";

// Components — Organisms
export { WindowPanel, StatDisplay, SlideControl, GamePanel } from "./components";

// Screens
export { CombatHUD, CharacterSheet, InventoryPanel } from "./screens";
export type { CombatHUDProps, CharacterSheetProps, InventoryPanelProps } from "./screens";
