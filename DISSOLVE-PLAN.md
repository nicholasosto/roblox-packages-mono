# Dissolve Plan: roblox-packages-mono

**Self-contained brief.** This plan will be handed to a Claude session in the consuming game project (`~/GameDev/roblox-testing-environment`). That Claude will not have read the inventory or diagnosis; everything it needs to act on this is below.

---

## What this is

`~/GameDev/roblox-packages-mono` is a pnpm workspace of 11 roblox-ts/Flamework packages published under the `@trembus/` scope. The monorepo is intended as plug-and-play infrastructure for Roblox games — a game creation engine pulls from it as an inventory of capabilities.

Current packages: **audio, currency, logger, persistent-data, rbx-ui, rig-spawner, slotable-items, stats, status-effects, timer, timer-ui.**

This plan consolidates where the packages share concerns — preserving every observable behavior while eliminating three duplicated type systems, cleaning up three growth-ring inconsistencies, and clarifying the platform's layering.

**Guarantee**: every capability currently exposed by any package is preserved. No runtime behavior changes unless explicitly called out. Package *names* may change; public *shapes* may change; *behavior* does not.

---

## Target shape

### Package layering

A clear layering, read top-down = dependency direction:

```
Layer 5 — Game integration
  rig-spawner

Layer 4 — Domain UI
  rpg-ui         (NEW — extracted from rbx-ui)
  timer-ui

Layer 3 — UI primitives
  ui-primitives  (RENAMED from rbx-ui, narrowed to genre-agnostic)

Layer 2 — RPG domain
  currency
  slotable-items
  stats

Layer 1 — Generic runtime
  audio
  status-effects
  timer

Layer 0 — Foundation
  logger
  persistent-data
```

All intra-layer deps go upward only. Layer 0 depends on nothing. Layer 2 may depend on Layer 0/1. And so on.

### Directory tree after dissolution

```
roblox-packages-mono/
├── PACKAGES.md                    # NEW — platform manifest (see below)
├── CLAUDE.md                      # UPDATED — list all 11, reflect new layout
├── package.json
├── pnpm-workspace.yaml
└── packages/
    ├── audio/                     # (unchanged shape; Logger-integrated already)
    ├── currency/                  # (persistence uses new defineSlice helper)
    ├── logger/                    # (unchanged)
    ├── persistent-data/           # (+ defineSlice helper; + Logger adoption)
    ├── rig-spawner/               # (+ Logger adoption; humanoid-config bug fix)
    ├── rpg-ui/                    # NEW — extracted RPG view-models + screens
    ├── slotable-items/            # (uses unified effect types; base-class cleanup)
    ├── stats/                     # (unchanged shape; canonical MasterStatKey home)
    ├── status-effects/            # (owns unified PassiveEffect + ShieldState)
    ├── timer/                     # (unchanged)
    ├── timer-ui/                  # (unchanged)
    └── ui-primitives/             # RENAMED from rbx-ui, stripped to primitives
```

### Core abstractions (post-dissolve)

- **`@trembus/status-effects`** owns the canonical cross-package effect vocabulary:
  - `EffectType` enum (10 values, aligned with what's in the three current copies).
  - `PassiveEffect { type, magnitude, source, cooldownSec?, procChance?, durationSec?, radiusStuds? }`.
  - `ShieldState` runtime type (was duplicated in soul-gem-types).
  - `EffectSource` provenance type.

- **`@trembus/stats`** owns the canonical stat keyspace: `MasterStatKey`, `StatModifierMap = Partial<Record<MasterStatKey, number>>`. Other packages (slotable-items, status-effects) replace their stringly-typed modifier maps by importing from stats. No runtime change; the types gain teeth.

- **`@trembus/persistent-data`** exports a `defineSlice<T>({ name, version, template, migrations? })` helper that returns a `PersistenceSlice<T>`. Each consumer (currency, stats, slotable-items) replaces their boilerplate slice constant with a `defineSlice` call.

- **`@trembus/ui-primitives`** = design-system + genre-agnostic primitives (Tokens, StatusBadge, SlideControl, WindowPanel, GamePanel). No RPG concepts.

- **`@trembus/rpg-ui`** = everything in current `rbx-ui/screens/` + the RPG-specific components (ResourceBar, AbilitySlot, ItemSlot, PlayerFrame, TargetFrame, StatDisplay) + the view-model types. Depends on `ui-primitives`, `stats`, `slotable-items`. Re-exports `RARITY_COLORS` derived from `slotable-items::ItemRarityKey` (6 rarities, not 4).

---

## Capability map

Every capability from the inventory, with its new home. `source → destination` format; where destination is unchanged, noted as "unchanged."

### Foundation (Layer 0)

| Capability | Current home | New home | Behavior change |
|---|---|---|---|
| Tag-based logging (Logger, LogFilter, Formatter, levels) | `logger` | `logger` | none |
| Profile loading/saving (PersistentDataManager) | `persistent-data` | `persistent-data` | `print`/`warn` replaced with Logger.create("PersistentData"); no externally-visible change |
| Profile schema + validators (BasePlayerProfile, ProfileSettings, is*) | `persistent-data` | `persistent-data` | none |
| Profile migrations (migrateProfile, buildMigrationMap) | `persistent-data` | `persistent-data` | none |
| PersistenceSlice interface | `persistent-data/slice.ts` | `persistent-data/slice.ts` | none |
| composeProfile | `persistent-data/compose.ts` | `persistent-data/compose.ts` | none |
| **`defineSlice<T>()` helper** | — | `persistent-data/slice.ts` | NEW — additive |

### Generic runtime (Layer 1)

| Capability | Current home | New home | Behavior change |
|---|---|---|---|
| AudioManager, SfxPlayer, MusicPlayer, SoundPool | `audio` | `audio` | none |
| Audio types/constants | `audio` | `audio` | none |
| Timer class + state machine + thresholds | `timer` | `timer` | none (but rename `addTime`/`subtractTime` → `extendBy`/`shortenBy` with backward-compat aliases kept for one release) |
| TimerHooks global signal bus | `timer` | `timer` | none |
| formatTime | `timer` | `timer` | none |
| All status-effects runtime (stacking, damage-calc, shield, aggregator, buff-tracker) | `status-effects` | `status-effects` | none |
| **Unified `EffectType` enum** | 3 copies | `status-effects/types.ts` (canonical) | slotable-items + soul-gem-types re-export from here |
| **Unified `PassiveEffect` type** | `status-effects` (already) | `status-effects` (canonical) | slotable-items::PassiveEffectConfig becomes `PassiveEffect` without `source` (source is added when the effect is *emitted*, not when defined) |
| **Unified `ShieldState` runtime type** | `status-effects` + duplicate in `slotable-items/soul-gem-types` | `status-effects/types.ts` (canonical) | soul-gem-types imports from status-effects |
| **Unified `EffectSource` provenance** | `status-effects` (already) | `status-effects` | none |

### RPG domain (Layer 2)

| Capability | Current home | New home | Behavior change |
|---|---|---|---|
| Currency types, pure transactions, Wallet, defineCurrency | `currency` | `currency` | none |
| CURRENCY_PERSISTENCE_SLICE | `currency/persistence.ts` | `currency/persistence.ts` | uses `defineSlice` helper internally; same exported constant |
| Stats types (Primary/Derived/MasterStatKey) | `stats` | `stats` | none; now imported by other packages as the canonical keyspace |
| Stats calculator pipeline | `stats` | `stats` | none |
| ResourcePool, ResourcePoolSet | `stats` | `stats` | none |
| STATS_PERSISTENCE_SLICE + allocation helpers | `stats` | `stats` | slice uses `defineSlice`; allocation helpers unchanged |
| Slot system (categories, slot keys, utilities) | `slotable-items/slot-types.ts` | `slotable-items/slot-types.ts` | none; dedup duplicate `getSlotCategoryFromSlotType` by making it call the canonical `getSlotCategory` |
| Slotable mixins (StatModifiable, PassiveGranting, AbilityGranting, Stackable) | `slotable-items/base-types.ts` | `slotable-items/base-types.ts` | none |
| Equipment/Accessory/Consumable/Ability/SoulGem catalog + instance types | `slotable-items/*-types.ts` | `slotable-items/*-types.ts` | **Equipment, Ability, SoulGem entries change from re-declared fields to `extends BaseSlotableCatalogEntry` + mixins.** Identical resulting shape; internal only |
| **StatModifiers = stringly-typed** | `slotable-items/types.ts` | `slotable-items/types.ts` | **replaced** by `import { StatModifierMap } from "@trembus/stats"` — identical runtime, typed keys |
| Unified inventory queries | `slotable-items/inventory.ts` | `slotable-items/inventory.ts` | none |
| Network operation types | `slotable-items/operations.ts` | `slotable-items/operations.ts` | none |
| INVENTORY_PERSISTENCE_SLICE | `slotable-items/persistence.ts` | `slotable-items/persistence.ts` | uses `defineSlice` helper |
| RARITY_SORT_ORDER, ItemRarityKey | `slotable-items/types.ts` | `slotable-items/types.ts` | now re-exported by rpg-ui for UI consumers |

### UI layers (3 & 4)

| Capability | Current home | New home | Behavior change |
|---|---|---|---|
| Design tokens (BG, BORDER, AMBER, TACTICAL, SIGNAL, INTEL, PURPLE, STAT, TEXT, FONTS, FONT_SIZE, SPACING, RADII, INTENT_COLORS, ColorIntent, IntentColors, withAlpha) | `rbx-ui/design-system/Tokens.ts` | `ui-primitives/design-system/Tokens.ts` | none |
| StatusIntentMap + getIntent | `rbx-ui/design-system/StatusIntentMap.ts` | `ui-primitives/design-system/StatusIntentMap.ts` | none; but flagged to prune Trembus-internal statuses before publishing externally (out-of-scope observation from diagnosis) |
| Generic components: StatusBadge, SlideControl, WindowPanel, GamePanel, ControllerCard | `rbx-ui/components/*.tsx` | `ui-primitives/components/*.tsx` | none |
| RPG components: ResourceBar, AbilitySlot, ItemSlot, PlayerFrame, TargetFrame, StatDisplay | `rbx-ui/components/*.tsx` | `rpg-ui/components/*.tsx` | none; props may retype to use domain types (`DerivedStatKey` instead of `"health"\|"mana"\|"stamina"`) |
| RPG screens: CombatHUD, CharacterSheet, InventoryPanel | `rbx-ui/screens/*.tsx` | `rpg-ui/screens/*.tsx` | none |
| RPG view-models: ResourceData, AbilityData, CombatEntityData, CharacterStat, DerivedStat, CharacterData, ItemData, ItemCategory | `rbx-ui/types.ts` | `rpg-ui/types.ts` | **`ItemRarity` (4 levels) replaced by import of `ItemRarityKey` (6 levels) from slotable-items**; `ResourceData.color` retyped to `DerivedStatKey` or a `ResourceKind` alias |
| RARITY_COLORS (4 entries) | `rbx-ui/types.ts` | `rpg-ui/types.ts` (as 6 entries) | **6 rarities, not 4.** Legendary, Mythic added (tokens already defined in the design system — AMBER.c500 + PURPLE.c500). Behavior change: consumers using the 4-entry map get 2 additional entries, not a removal. |

### Timer UI (Layer 4)

| Capability | Current home | New home | Behavior change |
|---|---|---|---|
| TimerDisplay, EffectsEngine, ANCHOR_MAP, resolveDisplayConfig | `timer-ui` | `timer-ui` | none |
| All effect configs | `timer-ui/types.ts` | `timer-ui/types.ts` | none |

### Game integration (Layer 5)

| Capability | Current home | New home | Behavior change |
|---|---|---|---|
| RigCatalog, RigSpawner, SpawnedRigMeta | `rig-spawner` | `rig-spawner` | `print`/`warn` replaced with Logger.create("RigSpawner") |
| Faction enum, RigEntry, SpawnConfig, HumanoidConfig | `rig-spawner/types.ts` | `rig-spawner/types.ts` | **`HumanoidConfig.displayName` renamed to `showDisplayDistance` (or removed entirely, pending investigation — see False Incidentals)** |
| Default constants | `rig-spawner/constants.ts` | `rig-spawner/constants.ts` | none |

**Coverage check**: every capability from `DISSOLVE-INVENTORY.md` appears in the table above. ✓
**Scope-creep check**: zero capabilities added beyond what already exists, except `defineSlice` (explicitly a helper that reduces existing boilerplate). ✓

---

## False incidentals carried forward ⚠️

These look like cruft, are load-bearing. The rebuild **must** preserve each. Trace each to its new location:

| False incidental | Current location | New location | How it manifests |
|---|---|---|---|
| `const robloxPrint = print; const robloxWarn = warn;` before Logger class | `logger/logger.ts:6-7` | `logger/logger.ts` (same) | Carried verbatim; add comment: `// Alias Roblox globals before class shadows them (Logger.warn/.error would infinite-recurse otherwise).` |
| `activeSoundIsA` flip after `play()` in MusicPlayer | `audio/music-player.ts:53` | `audio/music-player.ts` (same) | Dual-buffered crossfade; keep with comment explaining the swap |
| `task.delay(duration, () => outgoing.Stop())` after crossfade tween | `audio/music-player.ts:47` | `audio/music-player.ts` (same) | Matches tween duration; never inline the Stop() |
| `spawnX`/`spawnY`/`spawnZ` as 3 separate number attributes | `rig-spawner/rig-spawn-service.ts:69-71` + `spawned-rig-component.ts:20-23` | same files | Roblox attributes don't accept Vector3. Writer and reader must ship as a pair |
| `task.spawn` wrap around `StartSessionAsync` | `persistent-data/persistent-data.ts:32` | same file | Async yield boundary; unwrapping serializes joins |
| `if (!player.IsDescendantOf(game))` after async yield | `persistent-data/persistent-data.ts:42-45` | same file | Player may leave during yield; without guard, profile leaks |
| `sessionTime = os.time() - profile.Data.lastLogin` BEFORE updating lastLogin | `persistent-data/persistent-data.ts:85` | same file | Order is load-bearing; reordering zeros playtime |
| `procChance` read as `critDamageBonus` in `CriticalEnhance`; as `percentReduction` in `DamageReduction` | `status-effects/aggregator.ts:60-63, 67-69` | `status-effects/aggregator.ts` (same) | Undocumented protocol between producers and aggregator. **The rebuild should formalize this — either split into two distinct effect types with named fields OR document the dual-slot protocol on PassiveEffect.** Flagged as a consolidation opportunity distinct from this dissolve. |
| `addTime` reduces elapsed; `subtractTime` increases elapsed | `timer/timer.ts:159-170` | `timer/timer.ts` | Rename to `extendBy` / `shortenBy` for clarity. **Keep the old names as deprecated aliases for one release** so consumers aren't broken. |
| `start()` re-entry guard when already Running | `timer/timer.ts:89-91` | same file | Allows `autoStart: true` + explicit `.start()` co-existing without double-Heartbeat |
| `getSlotCategoryFromSlotType` fallback to `"Equipment"` on unknown | `slotable-items/base-types.ts:109-116` | kept but dedup-pointed | Callers depend on non-throwing. Dedup by making this function call `getSlotCategory` from slot-types.ts; preserve fallback. |

---

## Migration path

Prefer incremental. Each step ships independently and leaves the monorepo in a working state.

### Step 1 — Documentation truth-up (no code changes)

- Update root `CLAUDE.md` to reflect all 11 packages and the proposed new layering.
- Create `PACKAGES.md` at the root: one row per package with `{ name, purpose, layer, peer deps, main entry, short integration snippet }`. This is the "inventory" a game-engine Claude reads to pick capabilities.
- Add `README.md` to each package (can start minimal: description, install, one usage example, peer-dep list).

This alone makes the monorepo dramatically more consumable. It's reversible. Land first.

### Step 2 — Introduce `defineSlice` helper (additive)

- Add `defineSlice<T>({ name, version, template, migrations? })` to `persistent-data/slice.ts`.
- Export from `persistent-data/index.ts`.
- No callers change yet.

### Step 3 — Dedupe `getSlotCategoryFromSlotType` in slotable-items (internal)

- Rewrite `base-types.ts::getSlotCategoryFromSlotType` to delegate to `slot-types.ts::getSlotCategory`.
- Both remain exported (public API preserved).

### Step 4 — Sweep Logger adoption into `rig-spawner` and `persistent-data`

- Add `@trembus/logger` as a peer dep to both packages.
- Replace every `print(...)` with `logger.info(...)` and every `warn(...)` with `logger.warn(...)`.
- Each package's log tag: `"RigSpawner"`, `"PersistentData"`.
- Behavior externally unchanged; levels now globally filterable.

### Step 5 — Consolidate effect types into status-effects

- Move canonical `EffectType` enum (10 values) into `status-effects/types.ts` if it isn't already there (it is).
- In `slotable-items/equipment-types.ts`: replace `PassiveEffectType` declaration with `export { EffectType as PassiveEffectType } from "@trembus/status-effects"`. Add `@trembus/status-effects` as a peer dep.
- In `slotable-items/soul-gem-types.ts`: merge `SoulGemEffectType` (has `"StatBoost"`, missing `"AuraEffect"`) — reconcile. If both values are needed, add `"StatBoost"` to the canonical `EffectType` and retain `"AuraEffect"`. Alias for backward compat.
- Move `RegenerativeShieldState` duplicate out of `soul-gem-types` and import `ShieldState` from `status-effects`.

### Step 6 — Replace stringly-typed stat modifiers with typed keys

- In `slotable-items/types.ts`: change `StatModifiers = Partial<Record<string, number>>` to `import { StatModifierMap } from "@trembus/stats"`; re-export as `StatModifiers` for backward compat.
- In `status-effects`: similarly adopt `StatModifierMap` from stats. `statBonuses: Map<string, number>` becomes `Map<MasterStatKey, number>`.
- Add `@trembus/stats` as peer dep where it wasn't.
- **This is the biggest ripple.** Games that cast strings to stat keys will type-check correctly now; games emitting unknown string keys will break loudly. This is the desired outcome (catches drift).

### Step 7 — Tighten slotable-items base-class inheritance

- In `equipment-types.ts`, `ability-types.ts`, `soul-gem-types.ts`: change each `CatalogEntry` from re-declaring fields to `extends BaseSlotableCatalogEntry` + appropriate mixins.
- Resulting shape is identical; tsc verifies.

### Step 8 — Convert all persistence slices to `defineSlice`

- In currency, stats, slotable-items: replace the `const X_PERSISTENCE_SLICE: PersistenceSlice<Y> = { ... }` with `export const X_PERSISTENCE_SLICE = defineSlice<Y>({ name: "...", version: 1, template: ..., migrations: new Map() })`.
- Same runtime result.

### Step 9 — Split `rbx-ui` → `ui-primitives` + `rpg-ui`

- Create `packages/ui-primitives/` with `design-system/` (Tokens, StatusIntentMap) and the genre-agnostic components.
- Create `packages/rpg-ui/` with the RPG view-models, RPG components, screens. Peer deps: `ui-primitives`, `stats`, `slotable-items`.
- Update `rpg-ui/types.ts` to import `ItemRarityKey` from slotable-items (6 rarities), replace RARITY_COLORS with a 6-entry map using existing tokens.
- Delete `packages/rbx-ui/`. Add a migration note to PACKAGES.md: "`@trembus/rbx-ui` is deprecated; import primitives from `@trembus/ui-primitives` and RPG UI from `@trembus/rpg-ui`."

### Step 10 — `rig-spawner::HumanoidConfig.displayName` investigation

- Grep all consumers for `humanoidConfig: { displayName: ... }`.
- If no real consumers: delete the field.
- If consumers exist: rename to `showDisplayDistance: boolean` (matching the actual behavior), and write a one-line migration helper.
- Do this in isolation — don't bundle with other changes.

### Step 11 — Timer addTime/subtractTime rename

- Add `extendBy(seconds)` and `shortenBy(seconds)` methods with correct math.
- Mark `addTime` and `subtractTime` as `@deprecated` with JSDoc pointing to the new names; keep their current implementations (which are load-bearing for existing countdown callers).
- One release later: remove the old names.

### Step 12 — `aggregator.ts` field-overloading protocol formalization (out-of-scope)

Flagged as a **separate follow-up project**, not part of this dissolve. The `procChance` reuse in `CriticalEnhance` and `DamageReduction` is a real protocol; changing it requires producer and consumer to change in lockstep. Not safe to bundle with the consolidations above.

---

## Alternatives considered

### Alternative: Single `@trembus/game-foundation` package

A new layer-0 package owning `MasterStatKey`, unified `EffectType`, `ShieldState`, all cross-cutting mixins, `defineSlice`.

**Why not chosen**: Adds a package rather than reducing the count. Violates the current "one concern per package" rule without a clear domain for "foundation." Each cross-cutting type already has a natural home: stats owns stat keys, status-effects owns effect vocab, persistent-data owns the slice helper, slotable-items owns item rarities. Distributing to their natural owners is cleaner than creating an umbrella.

### Alternative: Merge overlapping packages

e.g., merge status-effects into stats (both are combat math); merge soul-gem-types out of slotable-items and into status-effects (it's half effect math).

**Why not chosen**: Couples consumers. Games that only want stats (no effects) or only want inventory (no soul gems) would pay the merge cost. The current "one concern per package" model is a feature — it lets downstream games pick precisely what they need. Preserve it.

### Alternative: Don't split rbx-ui

Leave all UI in one package; just fix the type drift (6-rarity, typed resource colors).

**Why not chosen**: rbx-ui currently has zero internal deps. Fixing the type drift means rbx-ui would depend on stats + slotable-items. A game that only wants the design system (or only wants a StatusBadge for a non-RPG) gets dragged into the RPG domain. The split — primitives stays free of domain deps, rpg-ui is where the coupling lives — makes that explicit.

### Alternative: One big-bang refactor

Do Steps 5, 6, 7, 8, 9 all in one branch.

**Why not chosen**: Step 6 (typed stat keys) is the most likely to surface latent bugs in downstream code. Isolating it makes rollback tractable. Each listed step is ship-able alone and leaves the monorepo green.

---

## Risks

- **Type-key tightening (Step 6) is the load-bearing change.** Any consumer currently emitting a stat modifier key that doesn't match `MasterStatKey` will fail to compile. Mitigation: compile the consuming game project (`roblox-testing-environment`) against the new types first; fix compile errors; land the monorepo change afterward.

- **Step 5 effect-type merge may alter `SoulGemEffectType`'s membership.** Current `SoulGemEffectType` has `"StatBoost"` which `PassiveEffectType` lacks; `PassiveEffectType` has `"AuraEffect"` which `SoulGemEffectType` lacks. The canonical unified enum must be the *union* (11 values), and both call sites handle both values. Audit switches on these enums in aggregator to ensure coverage.

- **`aggregator.ts` procChance field-overloading** (Step 12, deferred) is the single largest hidden contract in the monorepo. Do not accidentally change it during Step 5; the effect-type consolidation must not touch the numeric-field protocol.

- **`HumanoidConfig.displayName`** (Step 10) may be a silent bug that's masked real intent. Investigate carefully; do not remove without a grep-clean confirmation.

- **rbx-ui → ui-primitives + rpg-ui split** (Step 9) is the biggest public-API change. Downstream consumers importing `@trembus/rbx-ui` will all need updates. Coordinate with game projects; publish a deprecation for one release before removing.

- **No test suite exists.** Every migration step above is "trust the types + spot-check at runtime." Consider scaffolding characterization tests before attempting any rebuild (Phase 5 of a Dissolve, separate from this plan).

---

## Verification approach (when rebuild phase is requested)

This plan stops at phase 4. If phase 5 (rebuild) is later requested, verification should:

1. For each row in the capability map, grep the new location for the capability's exports. Confirm presence.
2. Run `pnpm --filter <package> build` on every package after each migration step; cannot proceed to next step if any package fails.
3. Build the consuming game project (`roblox-testing-environment`) against the new package versions; if Step 6 (typed stat keys) reveals compile errors, enumerate them and decide: fix in game or relax the type.
4. Load-test the profile migration path in a staging place before promoting any `persistent-data` change.
5. For each "False incidental" in the table above, confirm the corresponding code in the new location either preserves the line verbatim or has an accompanying comment explaining the semantic.

---

## Deliverables to the game-engine Claude session

When you (the downstream Claude) pick this plan up, here's what to do with it:

1. **Treat `PACKAGES.md` (once Step 1 lands) as the inventory source.** Don't rely on the current root CLAUDE.md; it undercounts.
2. **If you find a stat-modifier key in game code that's a magic string**: migrate it to `MasterStatKey` from `@trembus/stats`. The type is the source of truth.
3. **If you need `ItemRarity` for UI**: import `ItemRarityKey` (6 levels) from `@trembus/slotable-items`, not the old 4-level `ItemRarity` from the deprecated `@trembus/rbx-ui`.
4. **Cross-package effects** should go through `@trembus/status-effects` — its `EffectType`, `PassiveEffect`, `ShieldState` are the vocabulary.
5. **New persistence data** → `defineSlice({ name, version, template, migrations })` from `@trembus/persistent-data`. Don't hand-roll the slice shape.
6. **UI**: design primitives + generic components from `@trembus/ui-primitives`; RPG-specific (HUD, CharacterSheet, InventoryPanel, resource bars) from `@trembus/rpg-ui`.
7. **Any package still using raw `print`/`warn`** (pre-Step 4 timeline): that's a migration target; use `Logger.create("TagName")`.
