#!/usr/bin/env tsx
// ─── @trembus/animation-catalog: CI Gate — Validate Catalog ─────────────────
//
// Verifies:
//   1. Every entry's assetId appears in the master CSV with kind=Animation
//   2. Every CSV Animation row is in the catalog OR in IGNORE_LIST
//   3. Every tglName matches the ANI regex from taxonomy.yaml v1.3.0
//
// Exits 0 on pass, 1 on any failure (with a list of failures printed).

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
// PKG_ROOT = .../Master-Managed/Repositories/Gaming/Roblox-Repositories/roblox-packages-mono/packages/animation-catalog
// Need to go up 6 levels to reach Master-Managed/, then descend into Project-Spaces/...
const ASSETS_ROOT = resolve(PKG_ROOT, "../../../../../../Project-Spaces/Roblox-Development/Soul-Steel-Official/external-locations/assets");
const MASTER_CSV = resolve(ASSETS_ROOT, "__master-asset-ids-validated.csv");
const CATALOG_TS = resolve(PKG_ROOT, "src/catalog.ts");
const OVERRIDES_TS = resolve(PKG_ROOT, "src/catalog.overrides.ts");

const ANI_TGL_REGEX = /^ANI_(CST|CMB|MOV|EMO|NPC|ABL|TRN|BEM|KI)_[A-Z][A-Za-z0-9]+_(BLK|FNL)$/;

type CsvRow = Record<string, string>;
function parseCsv(path: string): CsvRow[] {
  if (!existsSync(path)) {
    console.error(`✗ Cannot find ${path}`);
    process.exit(1);
  }
  const text = readFileSync(path, "utf8").trim();
  const [header, ...rows] = text.split("\n");
  const cols = header.split(",").map((s) => s.trim());
  return rows.map((line) => {
    const vals = line.split(",");
    const r: CsvRow = {};
    cols.forEach((c, i) => (r[c] = (vals[i] ?? "").trim()));
    return r;
  });
}

function extractCatalogEntries(path: string): { assetId: string; tglName: string; logicalName: string }[] {
  if (!existsSync(path)) {
    console.error(`✗ Cannot find ${path}`);
    process.exit(1);
  }
  const text = readFileSync(path, "utf8");
  // Naive extraction: walk for `assetId: "rbxassetid://NNN"` and match adjacent fields.
  const entries: { assetId: string; tglName: string; logicalName: string }[] = [];
  const re = /logicalName:\s*"([^"]+)"[^}]*assetId:\s*"rbxassetid:\/\/(\d+)"[^}]*tglName:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    entries.push({ logicalName: m[1], assetId: m[2], tglName: m[3] });
  }
  return entries;
}

function extractIgnoreList(path: string): Set<string> {
  if (!existsSync(path)) return new Set();
  const text = readFileSync(path, "utf8");
  const match = text.match(/IGNORE_LIST[^=]*=\s*\[([^\]]*)\]/);
  if (!match) return new Set();
  const ids = [...match[1].matchAll(/"(\d+)"/g)].map((x) => x[1]);
  return new Set(ids);
}

// ─── main ────────────────────────────────────────────────────────────────────
const csvAnims = parseCsv(MASTER_CSV).filter(
  (r) => r.kind === "Animation" || r.actual_kind === "Animation",
);
const csvIds = new Set(csvAnims.map((r) => r.id));
const catEntries = extractCatalogEntries(CATALOG_TS);
const ignoreList = extractIgnoreList(OVERRIDES_TS);

let fails = 0;

// 1. Every catalog assetId is in CSV
for (const e of catEntries) {
  if (!csvIds.has(e.assetId)) {
    console.error(`✗ Catalog entry "${e.logicalName}" references assetId ${e.assetId} not in master CSV`);
    fails++;
  }
}

// 2. Every CSV row is in catalog or IGNORE_LIST
const catIds = new Set(catEntries.map((e) => e.assetId));
for (const row of csvAnims) {
  if (!catIds.has(row.id) && !ignoreList.has(row.id)) {
    console.error(`✗ CSV animation ${row.id} (${row.tglName ?? "no tglName"}) not in catalog or IGNORE_LIST`);
    fails++;
  }
}

// 3. Every tglName matches the ANI regex
for (const e of catEntries) {
  if (!ANI_TGL_REGEX.test(e.tglName)) {
    console.error(`✗ Catalog entry "${e.logicalName}" has invalid tglName "${e.tglName}" (must match ANI_<SUB>_<PascalName>_<Status>)`);
    fails++;
  }
}

if (fails === 0) {
  console.log(`✓ Catalog valid: ${catEntries.length} entries, ${csvAnims.length} CSV animations, ${ignoreList.size} ignored`);
  process.exit(0);
}
console.error(`✗ ${fails} validation failure(s)`);
process.exit(1);
