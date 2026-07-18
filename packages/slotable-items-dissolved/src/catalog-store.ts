// ─── Slotable Items: Catalog / Template Store ─────────────────────────────────
//
// The package-owned store of concrete item TEMPLATES (catalog entries). v1.0 adds this
// so the package resolves catalog data internally instead of threading a `catalogLookup`
// callback through every call. Mirrors slot-category-registry.ts: a Map + non-throwing,
// warn-on-override registration (boot code registers hundreds of entries and wants a
// collected report, not a crash on entry #3).

import type { BaseSlotableCatalogEntry } from "./base-types";
import type { SlotCategoryKey } from "./slot-types";
import { isCategoryRegistered } from "./slot-category-registry";
import { getKindForCategory } from "./item-kind-registry";

const catalog = new Map<string, BaseSlotableCatalogEntry>();

export interface CatalogRegisterResult {
  readonly ok: boolean;
  readonly id: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface CatalogRegisterOptions {
  /** When an id already exists: "overwrite" (default, warns) or "skip". */
  readonly onDuplicate?: "overwrite" | "skip";
  /** Suppress the warn() side-effects (the result still carries the messages). */
  readonly silent?: boolean;
}

function validateEntry(entry: BaseSlotableCatalogEntry): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (entry.id === undefined || entry.id === "") errors.push("catalog entry missing 'id'");
  if (entry.display === undefined) errors.push(`catalog entry '${entry.id}' missing 'display'`);
  if (entry.rarity === undefined) errors.push(`catalog entry '${entry.id}' missing 'rarity'`);
  if (entry.slotCategory === undefined || entry.slotCategory === "") {
    errors.push(`catalog entry '${entry.id}' missing 'slotCategory'`);
  } else if (!isCategoryRegistered(entry.slotCategory)) {
    // Warn-and-accept: boot order may register catalog before a late category;
    // auditRegistries() is the real gate.
    warnings.push(
      `catalog entry '${entry.id}' has unregistered slotCategory '${entry.slotCategory}' (register the category at boot)`,
    );
  }

  // Kind-level schema validation (call-time lookup — safe across the catalog<->kind cycle).
  const kind = getKindForCategory(entry.slotCategory);
  if (kind !== undefined && kind.validateCatalog !== undefined) {
    for (const issue of kind.validateCatalog(entry)) {
      if (issue.level === "error") errors.push(`[${entry.id}] ${issue.message}`);
      else warnings.push(`[${entry.id}] ${issue.message}`);
    }
  }

  return { warnings, errors };
}

export function registerCatalogEntry(
  entry: BaseSlotableCatalogEntry,
  options?: CatalogRegisterOptions,
): CatalogRegisterResult {
  const onDuplicate = options?.onDuplicate ?? "overwrite";
  const silent = options?.silent ?? false;
  const validation = validateEntry(entry);
  const warnings = validation.warnings;
  const errors = validation.errors;

  if (errors.size() > 0) {
    if (!silent) for (const e of errors) warn(`[slotable-items] ${e}`);
    return { ok: false, id: entry.id, warnings, errors };
  }

  if (catalog.has(entry.id)) {
    if (onDuplicate === "skip") {
      warnings.push(`duplicate id '${entry.id}' skipped`);
      if (!silent) warn(`[slotable-items] Catalog id '${entry.id}' already registered — skipped.`);
      return { ok: false, id: entry.id, warnings, errors };
    }
    warnings.push(`duplicate id '${entry.id}' overwritten`);
    if (!silent) warn(`[slotable-items] Overriding already-registered catalog entry '${entry.id}'.`);
  }

  if (!silent) for (const w of warnings) warn(`[slotable-items] ${w}`);
  catalog.set(entry.id, entry);
  return { ok: true, id: entry.id, warnings, errors };
}

export function registerCatalog(
  entries: readonly BaseSlotableCatalogEntry[],
  options?: CatalogRegisterOptions,
): readonly CatalogRegisterResult[] {
  const results: CatalogRegisterResult[] = [];
  for (const entry of entries) results.push(registerCatalogEntry(entry, options));
  return results;
}

export function getCatalogEntry(id: string): BaseSlotableCatalogEntry | undefined {
  return catalog.get(id);
}

export function hasCatalogEntry(id: string): boolean {
  return catalog.has(id);
}

export function listCatalogEntries(): BaseSlotableCatalogEntry[] {
  const out: BaseSlotableCatalogEntry[] = [];
  for (const [, e] of catalog) out.push(e);
  return out;
}

export function listCatalogEntriesByCategory(cat: SlotCategoryKey): BaseSlotableCatalogEntry[] {
  const out: BaseSlotableCatalogEntry[] = [];
  for (const [, e] of catalog) if (e.slotCategory === cat) out.push(e);
  return out;
}

/** Clear all registered catalog entries. Test-harness affordance. */
export function clearCatalog(): void {
  catalog.clear();
}
