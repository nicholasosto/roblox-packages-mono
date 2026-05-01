# Dissolve Diagnosis: roblox-packages-mono

See `DISSOLVE-INVENTORY.md` for the full capability surface. This document names what *grew* vs. what *was designed*, and where the load-bearing oddities live.

---

## Growth rings

The packages appear to have been added in four waves. Each wave introduced patterns the previous one didn't have, but the older packages were never retrofitted — which is where most of the incidental complexity sits.

1. **Ring 0 — Infrastructure foundation.**
   Original intent: logger, persistent-data (without slices), audio, rig-spawner. Feels like the "what does any game need?" layer: logging, saving, sounds, character spawning. Evidence: these are the four packages documented in the root CLAUDE.md. `rig-spawner`'s raw `print`/`warn` and `persistent-data`'s raw `print`/`warn` suggest these predate @trembus/logger's adoption.

2. **Ring 1 — Persistence slicing.**
   At some point, `BasePlayerProfile` alone wasn't enough — games wanted to bolt on per-feature data without forking `persistent-data`. The `PersistenceSlice<TData>` + `composeProfile` machinery arrived. Evidence: the composition API lives in separate files (`slice.ts`, `compose.ts`) — added *next to* the original `persistent-data.ts`, not integrated into it. The `onLoad` hook on `PersistentDataManagerConfig` is explicitly documented as "Per-slice migration hook from `composeProfile()`" — retrofit wiring, not original design.

3. **Ring 2 — RPG domain packages.**
   `currency`, `stats`, `slotable-items`, `status-effects` arrived together or in close succession. All four consume the slice pattern (three as optional peers on persistent-data; status-effects declines persistence and lives as pure runtime). The four share a set of concerns — stat math, effect math, item math — that were carved into separate packages by concern, not by domain. Evidence: all three persistence-consuming packages have a nearly-identical `persistence.ts` file; `slotable-items` comments reference `stats.MasterStatKey` as the "canonical" resolution of its string-typed keys.

4. **Ring 3 — UI layer.**
   `rbx-ui` was built independently — no internal @trembus deps. Its `types.ts` duplicates RPG concepts (stats, item rarities, resource colors) with *different* shapes than the domain packages. Evidence: rbx-ui `ItemRarity` has 4 levels; `slotable-items` has 6. rbx-ui `ResourceData.color` is hardcoded to `"health"|"mana"|"stamina"`; stats has 11 derived stats. This isn't a deliberate abstraction — it's divergent evolution.

5. **Ring 4 — Timer pair.**
   `timer` + `timer-ui` arrived as a clean pair. They're actually the best-designed pair in the monorepo: core logic with a global signal bus, UI that consumes via public API only. `timer-ui` is a perfect template for how the rest of the UI should have been split.

The **root CLAUDE.md was updated at the end of Ring 0 and never again** — it still names only the four original packages. That's the most visible growth-ring symptom.

---

## Essential complexity

Problem-intrinsic — must exist, should only be relocated, never "simplified."

- **Stats derivation pipeline** (`stats/calculator.ts`). Merge → apply-to-attributes → derive → apply-to-derived → combine. This is how RPG stats work; there's no shorter version that preserves correctness.
- **Dual-Sound crossfading** (`audio/music-player.ts`). Two Sound instances + swap-on-play is the minimum to achieve seamless crossfades in Roblox. Removing either instance breaks crossfades.
- **Pool-based SFX** (`audio/sfx-player.ts` + `sound-pool.ts`). Avoids per-play Sound instantiation cost for repeated SFX. `DEFAULT_POOL_SIZE=5` + `MAX_POOL_SIZE=20` bounds growth.
- **Profile migration runner** (`persistent-data/migrations.ts` + `compose.ts:migrateSlice`). Data schema evolution is a Hard Problem; the per-slice version-keyed migrator is the right shape.
- **Drag-drop slot compatibility** (`slotable-items`). Equipment uses strict slot matching (`MainHand → MainHand`); accessory/soul-gem/ability/consumable use "any slot within category". This *is* the rule; the branch in `isItemCompatibleWithSlot` can't go.
- **Diminishing-returns stacking** (`status-effects/stacking.ts:stackDiminishing`). `1 - (1-c)*(1-a)` is the correct formula for layered mitigation. Naive additive stacking would break balance at high counts.
- **Slice composition** (`persistent-data/compose.ts`). Each package owning its own schema + version + migrations is *the* load-bearing pattern for a multi-package monorepo with persistence. Keep.

---

## Incidental complexity

Growth artifacts. Candidates for consolidation, splitting, or relocation.

- **Three near-identical persistence.ts files** (`currency/`, `stats/`, `slotable-items/`). Each declares a `PersistenceSlice<T>` with the same five fields, an empty `migrations: new Map()`, and boilerplate `@example` JSDoc. Opportunity: a `defineSlice({ name, version, template, migrations? })` helper in `persistent-data` that returns the slice constant. Packages keep their data shapes; boilerplate vanishes.

- **Three near-identical effect-type enums** (`slotable-items/equipment-types.ts::PassiveEffectType`, `slotable-items/soul-gem-types.ts::SoulGemEffectType`, `status-effects/types.ts::EffectType`). 10 values each, 8-9 overlapping. The comment in `status-effects/types.ts` — *"aligned with slotable-items PassiveEffectType by convention"* — is an explicit acknowledgement that the alignment is manual and will drift.

- **Three nearly-identical shield runtime types** (`status-effects::ShieldState`, `slotable-items/soul-gem-types::RegenerativeShieldState`, the inline shield creation inside `aggregator.ts:35-43`). Same fields (sourceId/currentShield/maxShield/cooldown/regen/isOnCooldown); three homes.

- **Untyped stat-modifier keys across packages.** `slotable-items::StatModifiers = Partial<Record<string, number>>` and `status-effects::statBonuses = Map<string, number>` both use `string` keys. The *canonical* keyspace is `stats::MasterStatKey`. Because nobody imports it, the compiler can't enforce correctness — games have to cast at the boundary. `stats/types.ts` contains a comment documenting this exact gap.

- **Inconsistent Base-class usage in slotable-items.** `AccessoryCatalogEntry` and `ConsumableCatalogEntry` properly `extends BaseSlotableCatalogEntry` and use mixins (`StatModifiable`, `Stackable`). `EquipmentCatalogEntry`, `AbilityCatalogEntry`, and `SoulGemCatalogEntry` re-declare every field from Base. The mixin pattern was introduced with accessories/consumables; the earlier three were never updated.

- **Duplicated `getSlotCategory` implementations.** `slot-types.ts::getSlotCategory` and `base-types.ts::getSlotCategoryFromSlotType` do nearly the same thing. Called from different places. Should be one canonical function.

- **rbx-ui owns RPG view-model types** that duplicate (and conflict with) the real domain types. `CharacterStat`, `DerivedStat`, `ItemData`, `ItemRarity`, `RARITY_COLORS` — these belong with their domain packages, not with the UI primitives.

- **Logger adoption is a third done.** Only `audio` uses `@trembus/logger`. `persistent-data` has 7 raw `print`/`warn` sites; `rig-spawner` has 6. Raw `print`/`warn` ignore global log-level filtering, so turning noise off at runtime is only possible for `audio`.

- **Root CLAUDE.md documents 4 packages** but `packages/` has 11. Documentation drift is the most visible form of incidental complexity — it makes the monorepo harder to onboard to and will mislead downstream Claude sessions if uncorrected.

- **Mixed style between `enum` and `as const` arrays.** `timer`, `timer-ui`, `rig-spawner` use `enum`. `stats`, `slotable-items` use `as const` arrays + `typeof[number]`. Both are valid roblox-ts idioms, but picking one as the monorepo convention makes new-package scaffolding obvious.

- **Mixed private-field conventions.** `timer` uses `_underscore`-prefixed privates. `audio-manager`, `wallet`, `logger` use unprefixed privates. Small but pervasive.

---

## False essentials

Looks essential, isn't. Safe to change in the rebuild.

- **Equipment/Ability/SoulGem re-declaring Base fields.** Feels like "these need to diverge from Base" but actually they don't — the fields are identical. The pattern exists because these packages predate the mixin refactor. **Can and should switch to `extends BaseSlotableCatalogEntry + mixins` uniformly.**

- **rbx-ui's 4-rarity `ItemRarity`.** Looks like a deliberate UI simplification; actually just predates slotable-items' 6-rarity `ItemRarityKey`. Same concept, drifted.

- **rbx-ui's `ResourceData.color` union.** Looks like a typed enum; actually a hardcoded leak from stats' resource-pool concepts. Should resolve to `DerivedStatKey` or similar, or be purely presentational (a `Color3` token reference).

- **`rig-spawner::HumanoidConfig.displayName`.** Looks like a humanoid display-name override. The implementation uses it to set `DisplayDistanceType`, not `DisplayName`. Either a bug or a vestigial API. Flag: investigate before rebuilding this package — a consuming game may be passing something through that gets silently misrouted.

- **`rig-spawner`'s package.json "Flamework service" description.** Looks like Flamework integration; the class is plain. The description is stale.

---

## False incidentals ⚠️

Looks like cruft. Is load-bearing. **The plan MUST preserve each of these.**

- **`logger.ts:6-7` — `const robloxPrint = print; const robloxWarn = warn;` before the Logger class.** Looks like unnecessary aliasing. **Load-bearing**: the Logger class declares `warn()` and `error()` methods, which shadow the globals inside the class body. Without the aliases, `this.warn(...)` would infinite-recurse. Carry forward verbatim, with a comment explaining why.

- **`music-player.ts:53` — `this.activeSoundIsA = !this.activeSoundIsA;` after `play()`.** Looks like a random bool flip. **Load-bearing**: this is the swap half of a double-buffered crossfade. Dual Sound instances (`soundA`, `soundB`) alternate as "active" on each `play()` so the new track can fade in while the old fades out. Removing the flip causes the incoming track to overwrite the outgoing one mid-fade.

- **`music-player.ts:47` — `task.delay(duration, () => outgoing.Stop());`** Looks like a lazy defer. **Load-bearing**: the Tween sets `Volume → 0` over `duration` seconds; calling `Stop()` immediately would cut the fade. The delay matches the tween duration.

- **`rig-spawn-service.ts:69-71` — writing `spawnX`, `spawnY`, `spawnZ` as three separate number attributes.** Looks like a clumsy decomposition. **Load-bearing**: Roblox `SetAttribute` does not accept `Vector3` — only primitive types. This is the canonical round-trip idiom, and `SpawnedRigMeta.getSpawnPosition` expects exactly these three keys. Carry both writer and reader as a pair.

- **`persistent-data.ts:32` — `task.spawn(() => { const profile = this.store.StartSessionAsync(profileKey); … })`.** Looks like gratuitous async wrapping. **Load-bearing**: `StartSessionAsync` yields (can take seconds on cold start). Without the `task.spawn`, the caller's `Players.PlayerAdded` handler blocks until the profile returns — and if this is invoked on multiple players joining simultaneously, they serialize. Keep.

- **`persistent-data.ts:42-45` — `if (!player.IsDescendantOf(game)) { profile.EndSession(); return; }`.** Looks like a redundant check. **Load-bearing**: the player can leave during the async wait. Without this, the profile session leaks until the next kick.

- **`persistent-data.ts:85` — `const sessionTime = os.time() - profile.Data.lastLogin;` *before* updating lastLogin.** Looks like an innocent line. **Load-bearing**: order matters. `playtime += sessionTime` uses the *previous* lastLogin as the anchor, then `lastLogin` is stamped to now on next load. Reordering would zero out every session's playtime.

- **`aggregator.ts:60-63` — `CriticalEnhance` reading `procChance` as `critDamageBonus`, `DamageReduction` reading `procChance` as `percentReduction`.** Looks like an absurd field reuse. **Load-bearing (and worth documenting in the plan)**: these two effect types encode *two* numeric parameters (crit-chance + crit-damage; flat + percent). The `PassiveEffect` shape has `magnitude` + `procChance` as the two numeric slots. This is an *undocumented protocol between producers and this aggregator*. The rebuild should either split these into distinct effect types with named fields, or formalize this protocol — but silently removing the `procChance` read would break every effect emitting these types.

- **`base-types.ts::getSlotCategoryFromSlotType` falling back to `"Equipment"` on unknown.** Looks like a sloppy default. **Semi-load-bearing**: callers depend on *some* category being returned so the drag-drop path doesn't throw. The rebuild can tighten this to return `undefined` and force callers to handle, but must update all call sites in the same pass.

- **`timer.ts:159-162` — `addTime` subtracts, `subtractTime` adds.** Looks like a naming bug. **Load-bearing**: this works correctly for *countdown* timers, where reducing `elapsed` extends the time remaining. For count-up timers the naming is inverted. The rebuild should rename to `extendBy`/`shortenBy` (direction-agnostic), but must not simply flip the math — that breaks every caller that's been using it correctly for countdowns.

- **`timer.ts:51-54` (`this.config.autoStart` → `this.start()` in constructor)** combined with **`timer.ts:89-91` (`start` rejects re-entry if already Running).** Looks like redundant state checks. **Load-bearing**: consumers sometimes call `.start()` on a timer they've constructed with `autoStart: true`; without the re-entry guard, the Heartbeat would get connected twice.

---

## Observations out of scope

Spotted during analysis, *not* part of this Dissolve. Listed so they aren't lost.

- **No detected test suite.** Rebuilding any of these packages without tests first is high-risk. The inventory provides characterization-test seeds, but Dissolve Phase 5 (rebuild) should not proceed until some coverage exists. Recommend a separate mini-project to scaffold tests against the current behavior before any rebuild.
- **`TimerEffect.ProgressRing`** is defined in the enum but unhandled in `EffectsEngine.onTick`. Either delete from enum or implement — not a dissolve concern but worth filing.
- **`rig-spawner::HumanoidConfig.displayName` bug/vestige** (see False essentials). Investigate separately.
- **`rbx-ui::StatusIntentMap` contains ~70 status strings**, many of which are Trembus-internal (HR lifecycle, Chip Factory, Flamework status, dream/engram neural types). These don't belong in a reusable game UI library; they're leaking from some other Trembus system. Separate concern — but flag to downstream Claude that the map needs pruning before this package is called "reusable."
- **No README.md in any individual package.** Each has `src/` + `tsconfig.json` + `package.json`. A `README.md` per package would give the game-engine Claude a fast discovery surface without needing to re-read source. Not a structural dissolve issue, but a platform-ergonomics one.
- **`@rbxts/t` is a runtime validator used only in `persistent-data/types.ts`.** It's a dependency of one package, unused elsewhere. Either expand its role (validate inputs at package boundaries everywhere) or keep scoped.
- **`persistent-data`'s kick-the-player-on-session-takeover behavior** (`loadProfile:67-71`) is policy, not mechanism. A platform should probably let the consumer decide. Noted as a future "inject a KickBehavior" refactor.
