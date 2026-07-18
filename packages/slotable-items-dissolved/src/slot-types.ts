// ─── Slotable Items: Slot System (leaf — constants + types only) ──────────────
//
// OPEN-TAXONOMY REVAMP: this module is now a pure leaf. The category *vocabulary*
// of built-ins lives here as data; the *behavior* (routing, compatibility) and the
// open registration API live in `slot-category-registry.ts`, which imports these
// constants and self-registers the five built-ins. Keeping this a leaf (no function
// imports) avoids a module-load cycle between the registry and the routing functions.

// ── Category Keys (the BUILT-INS) ─────────────────────────────────────────────

/** The five built-in category keys. Games register MORE at runtime via registerSlotCategory(). */
export const SLOT_CATEGORY_KEYS = [
  "Equipment",
  "Accessory",
  "SoulGem",
  "Ability",
  "Consumable",
] as const;

/**
 * A slot category key. **Open** — built-ins are in SLOT_CATEGORY_KEYS, but a consuming
 * game may register additional categories (e.g. "Tower", "Pet", "Mount") at boot, so the
 * type is the widened `string`. (Was a closed 5-member union pre-revamp; widened per
 * ADR 0005. The package's own `StatModifiers` already uses this stringly-typed,
 * consumers-cast philosophy.)
 */
export type SlotCategoryKey = string;

// ── Per-Category Slot Keys (built-in, statically typed) ───────────────────────
// These stay literal unions so the built-in category modules keep full static typing.

export const EQUIPMENT_SLOT_KEYS = [
  "Head", "Chest", "Legs", "Feet", "Hands", "MainHand", "OffHand",
] as const;
export type EquipmentSlotKey = (typeof EQUIPMENT_SLOT_KEYS)[number];

export const ACCESSORY_SLOT_KEYS = ["Accessory1", "Accessory2"] as const;
export type AccessorySlotKey = (typeof ACCESSORY_SLOT_KEYS)[number];

export const SOUL_GEM_SLOT_KEYS = ["SoulGem1", "SoulGem2", "SoulGem3"] as const;
export type SoulGemSlotKey = (typeof SOUL_GEM_SLOT_KEYS)[number];

export const ABILITY_SLOT_KEYS = [
  "Ability1", "Ability2", "Ability3", "Ability4", "Ability5",
] as const;
export type AbilitySlotKey = (typeof ABILITY_SLOT_KEYS)[number];

export const CONSUMABLE_SLOT_KEYS = ["Consumable1", "Consumable2", "Consumable3"] as const;
export type ConsumableSlotKey = (typeof CONSUMABLE_SLOT_KEYS)[number];

// ── Universal Slot Type ───────────────────────────────────────────────────────

/**
 * Any slot key. **Open** — built-in slot keys are statically typed per category above;
 * this widened `string` form lets game-registered categories define their own slot keys.
 * (Was a closed 5-way union pre-revamp; widened per ADR 0005.)
 */
export type UniversalSlotTypeKey = string;

/** All built-in slot keys, flattened. (Game-registered slots are discovered via the registry.) */
export const ALL_SLOT_TYPE_KEYS: readonly string[] = [
  ...EQUIPMENT_SLOT_KEYS,
  ...ACCESSORY_SLOT_KEYS,
  ...SOUL_GEM_SLOT_KEYS,
  ...ABILITY_SLOT_KEYS,
  ...CONSUMABLE_SLOT_KEYS,
];
