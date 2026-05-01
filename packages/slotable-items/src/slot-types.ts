// ─── Slotable Items: Slot System ──────────────────────────────────────────────

// ── Slot Categories ──────────────────────────────────────────────────────────

export const SLOT_CATEGORY_KEYS = [
  "Equipment",
  "Accessory",
  "SoulGem",
  "Ability",
  "Consumable",
] as const;

export type SlotCategoryKey = (typeof SLOT_CATEGORY_KEYS)[number];

// ── Equipment Slots ──────────────────────────────────────────────────────────

export const EQUIPMENT_SLOT_KEYS = [
  "Head", "Chest", "Legs", "Feet", "Hands", "MainHand", "OffHand",
] as const;

export type EquipmentSlotKey = (typeof EQUIPMENT_SLOT_KEYS)[number];

// ── Accessory Slots ──────────────────────────────────────────────────────────

export const ACCESSORY_SLOT_KEYS = ["Accessory1", "Accessory2"] as const;

export type AccessorySlotKey = (typeof ACCESSORY_SLOT_KEYS)[number];

// ── Soul Gem Slots ───────────────────────────────────────────────────────────

export const SOUL_GEM_SLOT_KEYS = ["SoulGem1", "SoulGem2", "SoulGem3"] as const;

export type SoulGemSlotKey = (typeof SOUL_GEM_SLOT_KEYS)[number];

// ── Ability Slots ────────────────────────────────────────────────────────────

export const ABILITY_SLOT_KEYS = [
  "Ability1", "Ability2", "Ability3", "Ability4", "Ability5",
] as const;

export type AbilitySlotKey = (typeof ABILITY_SLOT_KEYS)[number];

// ── Consumable Slots ─────────────────────────────────────────────────────────

export const CONSUMABLE_SLOT_KEYS = ["Consumable1", "Consumable2", "Consumable3"] as const;

export type ConsumableSlotKey = (typeof CONSUMABLE_SLOT_KEYS)[number];

// ── Universal Slot Type ──────────────────────────────────────────────────────

/** Union of ALL slot type keys across every category. */
export type UniversalSlotTypeKey =
  | EquipmentSlotKey
  | AccessorySlotKey
  | SoulGemSlotKey
  | AbilitySlotKey
  | ConsumableSlotKey;

export const ALL_SLOT_TYPE_KEYS: readonly UniversalSlotTypeKey[] = [
  ...EQUIPMENT_SLOT_KEYS,
  ...ACCESSORY_SLOT_KEYS,
  ...SOUL_GEM_SLOT_KEYS,
  ...ABILITY_SLOT_KEYS,
  ...CONSUMABLE_SLOT_KEYS,
];

// ── Slot Utility Functions ───────────────────────────────────────────────────

/** Returns the category for a given slot type key. */
export function getSlotCategory(slotType: UniversalSlotTypeKey): SlotCategoryKey {
  // Equipment uses strict matching — each slot key maps 1:1
  if ((EQUIPMENT_SLOT_KEYS as readonly string[]).includes(slotType)) return "Equipment";
  // Other categories use prefix matching (e.g., "Accessory1" → "Accessory")
  if (string.sub(slotType, 1, 9) === "Accessory") return "Accessory";
  if (string.sub(slotType, 1, 7) === "SoulGem") return "SoulGem";
  if (string.sub(slotType, 1, 7) === "Ability") return "Ability";
  if (string.sub(slotType, 1, 10) === "Consumable") return "Consumable";
  return "Equipment"; // Fallback
}

/**
 * Equipment slots use STRICT matching (Head → Head only).
 * All other categories use ANY-to-ANY within the category.
 */
export function isStrictSlotType(slotType: UniversalSlotTypeKey): boolean {
  return (EQUIPMENT_SLOT_KEYS as readonly string[]).includes(slotType);
}

/**
 * Checks whether an item from `itemSlotType` can be placed in `targetSlotType`.
 * Equipment: strict 1:1 match. Others: any slot within the same category.
 */
export function isItemCompatibleWithSlot(
  itemSlotType: UniversalSlotTypeKey,
  targetSlotType: UniversalSlotTypeKey,
): boolean {
  const itemCategory = getSlotCategory(itemSlotType);
  const targetCategory = getSlotCategory(targetSlotType);

  if (itemCategory !== targetCategory) return false;

  // Equipment requires exact slot match
  if (itemCategory === "Equipment") {
    return itemSlotType === targetSlotType;
  }

  // All other categories: any slot within the same category
  return true;
}

/** Returns all slot keys compatible with the given item slot type. */
export function getCompatibleSlots(itemSlotType: UniversalSlotTypeKey): readonly UniversalSlotTypeKey[] {
  const category = getSlotCategory(itemSlotType);

  switch (category) {
    case "Equipment":
      return [itemSlotType]; // Strict 1:1
    case "Accessory":
      return ACCESSORY_SLOT_KEYS;
    case "SoulGem":
      return SOUL_GEM_SLOT_KEYS;
    case "Ability":
      return ABILITY_SLOT_KEYS;
    case "Consumable":
      return CONSUMABLE_SLOT_KEYS;
    default:
      return [];
  }
}
