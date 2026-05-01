/**
 * Trembus Design Tokens — Tactical Futurism
 * X-COM precision + Fallout warmth + philosophical depth
 *
 * These values are the single source of truth for the cross-platform
 * design system. Web equivalent: packages/ui-library/src/theme/tokens.css
 */

// ── Color Helpers ───────────────────────────────────────────

function hex(r: number, g: number, b: number): Color3 {
	return Color3.fromRGB(r, g, b);
}

function withAlpha(color: Color3, alpha: number): { color: Color3; transparency: number } {
	return { color, transparency: 1 - alpha };
}

// ── Background Layers ───────────────────────────────────────

export const BG = {
	deep: hex(10, 14, 20), // #0A0E14
	surface: hex(17, 24, 32), // #111820
	elevated: hex(26, 34, 48), // #1A2230
	hover: hex(34, 45, 61), // #222D3D
} as const;

// ── Borders ─────────────────────────────────────────────────

export const BORDER = {
	subtle: hex(30, 42, 58), // #1E2A3A
	accent: hex(42, 58, 74), // #2A3A4A
} as const;

// ── Accent Colors ───────────────────────────────────────────

export const AMBER = {
	c50: hex(255, 248, 225), // #FFF8E1
	c300: hex(255, 213, 79), // #FFD54F
	c400: hex(255, 202, 40), // #FFCA28
	c500: hex(255, 176, 0), // #FFB000
	c600: hex(255, 143, 0), // #FF8F00
} as const;

export const TACTICAL = {
	c400: hex(74, 222, 128), // #4ADE80
	c500: hex(34, 197, 94), // #22C55E
} as const;

export const SIGNAL = {
	c400: hex(248, 113, 113), // #F87171
	c500: hex(239, 68, 68), // #EF4444
} as const;

export const INTEL = {
	c400: hex(96, 165, 250), // #60A5FA
	c500: hex(59, 130, 246), // #3B82F6
} as const;

export const PURPLE = {
	c400: hex(192, 132, 252), // #C084FC
	c500: hex(168, 85, 247), // #A855F7
} as const;

// ── Stat Colors ────────────────────────────────────────────
// RPG resource & modifier display

export const STAT = {
	health: hex(220, 50, 50),    // #DC3232
	mana: hex(50, 50, 220),      // #3232DC
	stamina: hex(220, 220, 50),  // #DCDC32
	positive: hex(74, 222, 128), // #4ADE80 (= TACTICAL.c400)
	negative: hex(248, 113, 113), // #F87171 (= SIGNAL.c400)
} as const;

// ── Text ────────────────────────────────────────────────────

export const TEXT = {
	primary: hex(232, 224, 212), // #E8E0D4
	secondary: hex(138, 155, 176), // #8A9BB0
	tertiary: hex(85, 102, 119), // #556677
	amber: hex(255, 213, 79), // #FFD54F
} as const;

// ── Typography ──────────────────────────────────────────────

export const FONTS = {
	display: new Font("rbxasset://fonts/families/Michroma.json", Enum.FontWeight.Bold),
	body: new Font("rbxasset://fonts/families/SourceSansPro.json"),
	mono: new Font("rbxasset://fonts/families/RobotoMono.json", Enum.FontWeight.SemiBold),
} as const;

// Font size mapping (web px → Roblox TextSize)
export const FONT_SIZE = {
	xs: 10, // text-[10px]
	sm: 12, // text-xs
	md: 14, // text-sm
	lg: 16, // text-base
	xl: 20, // text-lg
	"2xl": 24, // text-2xl
} as const;

// ── Spacing ─────────────────────────────────────────────────

export const SPACING = {
	0: 0,
	1: 4,
	2: 8,
	3: 12,
	4: 16,
	5: 20,
	6: 24,
	8: 32,
	10: 40,
	12: 48,
} as const;

// ── Radii ───────────────────────────────────────────────────

export const RADII = {
	none: 0,
	sm: 2,
	md: 4, // badge default
	lg: 8,
	xl: 12,
	full: 9999,
} as const;

// ── Color Intent System ─────────────────────────────────────
// Maps semantic intents to color sets (bg at 15% opacity, border at 30%)

export type ColorIntent = "info" | "warning" | "success" | "danger" | "accent" | "neutral";

export interface IntentColors {
	bg: { color: Color3; transparency: number };
	text: Color3;
	border: { color: Color3; transparency: number };
}

export const INTENT_COLORS: Record<ColorIntent, IntentColors> = {
	info: {
		bg: withAlpha(INTEL.c500, 0.15),
		text: INTEL.c400,
		border: withAlpha(INTEL.c500, 0.3),
	},
	warning: {
		bg: withAlpha(AMBER.c500, 0.15),
		text: AMBER.c400,
		border: withAlpha(AMBER.c500, 0.3),
	},
	success: {
		bg: withAlpha(TACTICAL.c500, 0.15),
		text: TACTICAL.c400,
		border: withAlpha(TACTICAL.c500, 0.3),
	},
	danger: {
		bg: withAlpha(SIGNAL.c500, 0.15),
		text: SIGNAL.c400,
		border: withAlpha(SIGNAL.c500, 0.3),
	},
	accent: {
		bg: withAlpha(PURPLE.c500, 0.15),
		text: PURPLE.c400,
		border: withAlpha(PURPLE.c500, 0.3),
	},
	neutral: {
		bg: withAlpha(TEXT.tertiary, 0.2),
		text: TEXT.secondary,
		border: withAlpha(TEXT.tertiary, 0.3),
	},
};

// ── Utility ─────────────────────────────────────────────────

export { withAlpha };
