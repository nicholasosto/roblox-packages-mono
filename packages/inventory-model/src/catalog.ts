// ─── Inventory Model: Item Catalog ────────────────────────────────────────────
//
// The model needs exactly one thing from a catalog: whether an id is real, so that
// reconcile can drop ids that no longer exist. Item CONTENT is game-specific and
// deliberately not shipped here (repo convention 5) — a consuming game builds its
// own catalog and hands it in.

import type { ItemDefinition, ItemId, RgbTriple } from "./types";

export interface ItemCatalog {
  has(id: ItemId): boolean;
  /** Returns a defensive copy — callers cannot mutate the catalog through a read. */
  get(id: ItemId): ItemDefinition | undefined;
  ids(): ItemId[];
}

function cloneDefinition(definition: ItemDefinition): ItemDefinition {
  const color = definition.rarityColor;
  const rarityColor: RgbTriple = [color[0], color[1], color[2]];
  return {
    id: definition.id,
    name: definition.name,
    icon: definition.icon,
    rarity: definition.rarity,
    rarityColor,
  };
}

/**
 * Build a catalog from a definition list. Later entries win on duplicate ids, and
 * every read returns a clone — the Luau prototype asserted that guarantee in its
 * test suite ("Item definitions must be cloned") and it carries over intact.
 */
export function createCatalog(definitions: readonly ItemDefinition[]): ItemCatalog {
  const byId = new Map<ItemId, ItemDefinition>();
  for (const definition of definitions) {
    byId.set(definition.id, cloneDefinition(definition));
  }

  return {
    has(id: ItemId): boolean {
      return byId.has(id);
    },
    get(id: ItemId): ItemDefinition | undefined {
      const found = byId.get(id);
      return found !== undefined ? cloneDefinition(found) : undefined;
    },
    ids(): ItemId[] {
      const result: ItemId[] = [];
      for (const [id] of byId) result.push(id);
      return result;
    },
  };
}

/** A catalog that accepts every non-empty id. Useful for tests and for games that
 *  validate item existence elsewhere. */
export function createPermissiveCatalog(): ItemCatalog {
  return {
    has(id: ItemId): boolean {
      return id !== "";
    },
    get(): ItemDefinition | undefined {
      return undefined;
    },
    ids(): ItemId[] {
      return [];
    },
  };
}
