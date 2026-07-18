// ─── Slotable Items: Registry Health / Introspection ──────────────────────────
//
// Boot-time auditing across the three registries. Turns the old silent-"Equipment"
// fallback class of bug into a loud, explicit signal: a catalog entry whose slotCategory
// is unregistered, a category with no kind, a kind whose category never registered.
// Advisory by default (warn, don't crash — the registries' temperament); call
// assertRegistriesHealthy() if you want a hard boot gate.

import { listCategoryKeys, isCategoryRegistered } from "./slot-category-registry";
import { listKindKeys, listItemKinds, getKindForCategory, getItemKind } from "./item-kind-registry";
import { listCatalogEntries, listCatalogEntriesByCategory } from "./catalog-store";

export interface OrphanedCatalogEntry {
  readonly id: string;
  readonly slotCategory: string;
}

export interface RegistryHealthReport {
  readonly categories: readonly string[];
  readonly kinds: readonly string[];
  readonly catalogCount: number;
  /** Catalog entries whose slotCategory has NO registered category. */
  readonly orphanedCatalogEntries: readonly OrphanedCatalogEntry[];
  /** Registered categories with no item kind bound (can hold items, can't create them). */
  readonly categoriesWithoutKind: readonly string[];
  /** Kinds whose defaultSlotCategory isn't a registered category. */
  readonly kindsWithoutCategory: readonly string[];
}

export function auditRegistries(): RegistryHealthReport {
  const categories = listCategoryKeys();
  const kinds = listKindKeys();
  const entries = listCatalogEntries();

  const orphaned: OrphanedCatalogEntry[] = [];
  for (const e of entries) {
    if (!isCategoryRegistered(e.slotCategory)) orphaned.push({ id: e.id, slotCategory: e.slotCategory });
  }

  const categoriesWithoutKind: string[] = [];
  for (const cat of categories) {
    if (getKindForCategory(cat) === undefined) categoriesWithoutKind.push(cat);
  }

  const kindsWithoutCategory: string[] = [];
  for (const def of listItemKinds()) {
    if (!isCategoryRegistered(def.defaultSlotCategory)) kindsWithoutCategory.push(def.kind);
  }

  return {
    categories,
    kinds,
    catalogCount: entries.size(),
    orphanedCatalogEntries: orphaned,
    categoriesWithoutKind,
    kindsWithoutCategory,
  };
}

export interface KindDescription {
  readonly kind: string;
  readonly defaultSlotCategory: string;
  readonly capabilities: readonly string[];
  readonly hasValidator: boolean;
  readonly hasModifierContribution: boolean;
  readonly catalogEntryCount: number;
}

export function describeKind(kind: string): KindDescription | undefined {
  const def = getItemKind(kind);
  if (def === undefined) return undefined;
  return {
    kind: def.kind,
    defaultSlotCategory: def.defaultSlotCategory,
    capabilities: def.capabilities ?? [],
    hasValidator: def.validateCatalog !== undefined,
    hasModifierContribution: def.contributeModifiers !== undefined,
    catalogEntryCount: listCatalogEntriesByCategory(def.defaultSlotCategory).size(),
  };
}

/** Hard boot gate: throws if any catalog entry points at an unregistered category. */
export function assertRegistriesHealthy(): void {
  const report = auditRegistries();
  if (report.orphanedCatalogEntries.size() > 0) {
    const ids = report.orphanedCatalogEntries.map((o) => o.id).join(", ");
    error(`[slotable-items] Registry unhealthy: catalog entries with unregistered categories: ${ids}`);
  }
}
