// ─── Slotable Items: Item-Kind Registry (open item taxonomy) ──────────────────
//
// Opens the ITEM taxonomy the way slot-category-registry opened slot categories: a
// developer registers a brand-new item KIND ("Rune", "Tower", "Cosmetic") with its own
// factory, catalog validator, and modifier contribution — with ZERO package edits. Same
// Map + reverse-index + warn-on-override ergonomics as the category registry.
//
// KIND = the schema (how to build/validate/project an item); catalog entries = the rows
// (catalog-store.ts); slot-category = the routing table (slot-category-registry.ts).

import type { BaseSlotableCatalogEntry, BaseSlotableInstance } from "./base-types";
import type { SlotCategoryKey, UniversalSlotTypeKey } from "./slot-types";
import type { ModifierContribution } from "./modifier-types";
import type { UnifiedLoadout } from "./inventory";
import { getCatalogEntry } from "./catalog-store";

// ── Descriptor ────────────────────────────────────────────────────────────────

export interface KindValidationIssue {
  readonly level: "error" | "warning";
  readonly message: string;
}

export type ItemKindCapability = "StatModifiable" | "PassiveGranting" | "AbilityGranting" | "Stackable";

/**
 * Declares a kind of item. Built-ins register these at module load (see built-ins.ts);
 * games register their own at boot. `TCatalog`/`TInstance` give callers full typing at
 * the registration site; the registry stores them base-typed (the package's standard
 * consumers-cast idiom — see ADR 0005).
 */
export interface ItemTypeDefinition<
  TCatalog extends BaseSlotableCatalogEntry = BaseSlotableCatalogEntry,
  TInstance extends BaseSlotableInstance = BaseSlotableInstance,
> {
  /** Unique kind key, e.g. "Equipment" (built-in) or game-defined "Rune". */
  readonly kind: string;
  /** The slot category this kind's items live in. Usually === kind; decoupled on purpose. */
  readonly defaultSlotCategory: SlotCategoryKey;
  /** Validate a catalog entry of this kind at register time. Pure; returns issues. */
  readonly validateCatalog?: (entry: TCatalog) => readonly KindValidationIssue[];
  /** Build a fresh owned instance from a catalog entry. Generalizes createXInstance(...). */
  readonly createInstance: (entry: TCatalog, guid: string, ownerUserId: number, quantity?: number) => TInstance;
  /** How an equipped instance contributes to active modifiers (consumed by modifiers.ts). */
  readonly contributeModifiers?: (instance: TInstance, entry: TCatalog) => readonly ModifierContribution[];
  /** Normalize a loosely-shaped persisted instance after a profile load. Defaults to identity. */
  readonly reviveInstance?: (raw: BaseSlotableInstance) => TInstance;
  /** Stack policy — generalizes the consumable-only stacking helpers. */
  readonly stacking?: { readonly maxStackSize: number };
  /** Declared capabilities — metadata for introspection + modifier/passive routing. */
  readonly capabilities?: readonly ItemKindCapability[];
}

// ── Storage ───────────────────────────────────────────────────────────────────

const kinds = new Map<string, ItemTypeDefinition>();
const categoryToKind = new Map<string, string>(); // reverse index: slot category → kind key

// ── Registration API (mirrors registerSlotCategory) ───────────────────────────

export function registerItemKind<
  TCatalog extends BaseSlotableCatalogEntry = BaseSlotableCatalogEntry,
  TInstance extends BaseSlotableInstance = BaseSlotableInstance,
>(def: ItemTypeDefinition<TCatalog, TInstance>): void {
  if (kinds.has(def.kind)) {
    warn(`[slotable-items] Overriding already-registered item kind "${def.kind}".`);
    const stale: string[] = [];
    for (const [cat, k] of categoryToKind) if (k === def.kind) stale.push(cat);
    for (const cat of stale) categoryToKind.delete(cat);
  }
  // Store base-typed: the specialized generics are contravariant in their factory params,
  // so the cast is required and safe — readers use the typed helpers, not the raw entry.
  kinds.set(def.kind, def as unknown as ItemTypeDefinition);

  const existing = categoryToKind.get(def.defaultSlotCategory);
  if (existing !== undefined && existing !== def.kind) {
    warn(
      `[slotable-items] Slot category "${def.defaultSlotCategory}" was served by kind "${existing}"; reassigning to "${def.kind}".`,
    );
  }
  categoryToKind.set(def.defaultSlotCategory, def.kind);
}

export function getItemKind(kind: string): ItemTypeDefinition | undefined {
  return kinds.get(kind);
}

export function getKindForCategory(cat: SlotCategoryKey): ItemTypeDefinition | undefined {
  const k = categoryToKind.get(cat);
  return k !== undefined ? kinds.get(k) : undefined;
}

export function isKindRegistered(kind: string): boolean {
  return kinds.has(kind);
}

export function listItemKinds(): ItemTypeDefinition[] {
  const out: ItemTypeDefinition[] = [];
  for (const [, d] of kinds) out.push(d);
  return out;
}

export function listKindKeys(): string[] {
  const out: string[] = [];
  for (const [k] of kinds) out.push(k);
  return out;
}

/**
 * Resolve the kind for a catalog entry's category and build an instance — the generic,
 * category-agnostic create path the engine's `grantItem` uses (custom kinds included).
 */
export function createInstanceForEntry(
  entry: BaseSlotableCatalogEntry,
  guid: string,
  ownerUserId: number,
  quantity?: number,
): BaseSlotableInstance | undefined {
  const kind = getKindForCategory(entry.slotCategory);
  if (kind === undefined) {
    warn(`[slotable-items] No item kind registered for category "${entry.slotCategory}" (cannot create "${entry.id}").`);
    return undefined;
  }
  return kind.createInstance(entry, guid, ownerUserId, quantity);
}

// ── Typed opt-in helper (Tier 3 ergonomics) ───────────────────────────────────
// Generics stay LOCAL to the call — they never leak into UnifiedLoadout / the
// persistence slice / operation signatures (respecting ADR 0005's rejection of a
// fully-generic UnifiedInventory<TCategories>).

export interface TypedKindHelpers<
  TCatalog extends BaseSlotableCatalogEntry,
  TInstance extends BaseSlotableInstance,
> {
  readonly definition: ItemTypeDefinition<TCatalog, TInstance>;
  readonly getSlot: (loadout: UnifiedLoadout, slot: UniversalSlotTypeKey) => TInstance | undefined;
  readonly create: (entry: TCatalog, guid: string, ownerUserId: number, quantity?: number) => TInstance;
  readonly getEntry: (id: string) => TCatalog | undefined;
}

/** Register a kind AND get typed accessors bound to the game's local instance/catalog types. */
export function defineItemKind<
  TCatalog extends BaseSlotableCatalogEntry,
  TInstance extends BaseSlotableInstance,
>(def: ItemTypeDefinition<TCatalog, TInstance>): TypedKindHelpers<TCatalog, TInstance> {
  registerItemKind(def);
  return {
    definition: def,
    getSlot: (loadout, slot) => {
      const bucket = loadout[def.defaultSlotCategory];
      return bucket !== undefined ? (bucket[slot] as TInstance | undefined) : undefined;
    },
    create: (entry, guid, ownerUserId, quantity) => def.createInstance(entry, guid, ownerUserId, quantity),
    getEntry: (id) => getCatalogEntry(id) as TCatalog | undefined,
  };
}
