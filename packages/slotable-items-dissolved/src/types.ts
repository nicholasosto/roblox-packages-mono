// ─── Slotable Items: Foundation Types ─────────────────────────────────────────

// ── Rarity System ────────────────────────────────────────────────────────────

export const ITEM_RARITY_KEYS = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
] as const;

export type ItemRarityKey = (typeof ITEM_RARITY_KEYS)[number];

// ── Display Metadata ─────────────────────────────────────────────────────────

/** UI-facing metadata for any catalog entry. */
export interface UIDisplayMeta {
  readonly displayName: string;
  readonly description: string;
  readonly icon: string;
}

// ── Stat Modifiers ───────────────────────────────────────────────────────────

/**
 * Stat modifier map — uses string keys for game-agnosticism.
 * Consumers cast to their game's stat key type:
 *   `item.statModifiers as Partial<Record<MasterStatKey, number>>`
 */
export type StatModifiers = Partial<Record<string, number>>;
