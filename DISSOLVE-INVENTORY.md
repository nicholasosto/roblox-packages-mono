# Dissolve Inventory: roblox-packages-mono

**Target**: `/Users/nicholasosto/GameDev/roblox-packages-mono` — 11 packages in `packages/*`
**Date**: 2026-04-16
**Phase requested**: plan (no code changes)
**Scope confirmed with user**: All 11 packages in scope. Primary intent: consolidate where commonalities exist. Public API fully flexible (plan handed to a separate Claude session in the consuming game project).

---

## Public dependency graph (internal only)

```
persistent-data ◄── currency
                ◄── slotable-items
                ◄── stats

logger          ◄── audio

timer           ◄── timer-ui

rbx-ui          (no internal deps)
rig-spawner     (no internal deps)
status-effects  (no internal deps)
```

External peer deps: `@rbxts/services`, `@rbxts/profile-store`, `@rbxts/signal`, `@rbxts/t`, `@rbxts/react`.

---

## Capabilities per package

### @trembus/audio

Unified audio manager for SFX pooling, music crossfading, and volume/mute control.

- **AudioManager** (`audio-manager.ts`) — top-level class.
  - Volume control: `setMasterVolume`, `setCategoryVolume`, `mute`/`unmute`/`toggleMute`, `isMuted`. Master + per-category multipliers; mute remembers pre-mute volume.
  - SFX: `playSfx(config)`, `playSfxAtPosition(config, Vector3, parent?)`, `stopAllSfx`.
  - Music: `playMusic(track, crossfade?)`, `stopMusic(fadeOut?)`, `pauseMusic`, `resumeMusic`, `setPlaylist(tracks, shuffle?)`, `nextTrack(crossfade?)`, `isMusicPlaying`.
  - Lifecycle: `destroy()`.
- **SfxPlayer** (`sfx-player.ts`) — pooled SFX player. `play(config) → Sound?`, `playAtPosition`, `stopAll`, `destroy`. Creates `SoundPool` per unique soundId lazily. Spatial SFX use a transparent Part in SoundService and auto-Destroy on `Ended`.
- **MusicPlayer** (`music-player.ts`) — dual-Sound crossfading player. `play`, `stop(fadeOut?)`, `pause`, `resume`, `setPlaylist`, `next`, `isPlaying`, `destroy`. Uses `TweenService` for fades. Auto-advances playlist on `Ended` if looping is off.
- **SoundPool** (`sound-pool.ts`) — internal; acquire/stopAll/destroy. `DEFAULT_POOL_SIZE = 5`, `MAX_POOL_SIZE = 20`; warns when pool exhausted.
- **Types**: `AudioCategory = "sfx"|"music"|"ambient"|"ui"`, `SoundConfig`, `MusicTrack`, `AudioSettings`, `CrossfadeConfig`.
- **Constants**: `DEFAULT_MASTER_VOLUME`, `DEFAULT_CATEGORY_VOLUME`, `DEFAULT_CROSSFADE_DURATION = 1.5`, `DEFAULT_FADE_OUT_DURATION = 0.5`.
- **Observed invariants**: master volume clamped 0..1; category volume clamped 0..1; mute preserves and restores prior master volume.
- **Side effects**: creates Sound instances parented to SoundService; CollectionService untouched.
- **Logger integration**: uses `Logger.create("Audio")` — only package that does.

### @trembus/currency

Currency system: open registry, pure transactions, stateful Wallet, composable persistence slice.

- **Types** (`types.ts`) — `CurrencyKey = string` (open), `CurrencyDefinition { key, displayName, min, max?, integerOnly }`, `CurrencyBalances = Record<CurrencyKey, number>`, `TransactionResult { ok, balance, delta, reason? }`, `TransactionFailureReason = "insufficient"|"cap"|"invalid-amount"|"unknown-currency"`, `CurrencyChangeHandler`.
- **defineCurrency** (`defaults.ts`) — factory. Defaults: `min=0, integerOnly=true, no max`.
- **Pure transactions** (`transaction.ts`) — immutable, return-new-record.
  - `getBalance(balances, key) → number` (0 if missing).
  - `canAfford(balances, key, amount) → boolean`.
  - `debit(balances, def, amount) → { balances, result }`. Rejects NaN/negative/non-finite/fractional-when-integerOnly. `amount===0` succeeds with `delta=0`. Underflow below `min` → `insufficient`.
  - `credit(balances, def, amount) → { balances, result }`. Same validation. If at cap → `cap`; if partial room → partial credit.
  - `transfer(from, to, def, amount) → { from, to, result }`. Atomic: if credit fails at cap, debit is rolled back (neither side changes).
- **Wallet** (`wallet.ts`) — mutable container. `constructor(defs, startingBalances?)`, `getBalance`, `getDefinition`, `snapshot()`, `canAfford`, `credit`, `debit`, `setBalance` (clamp + emit), `load(balances)` (hydrate known keys only), `registerCurrency(def)`, `onChange(handler) → () => void` (detach).
- **Persistence slice** (`persistence.ts`) — `CURRENCY_PERSISTENCE_SLICE: PersistenceSlice<CurrencySliceData>`. sliceKey `"currency"`, versionKey `"currencyVersion"`, currentVersion 1, empty migrations map. Data shape `{ currencies, currencyVersion }`.
- **Implicit contracts**: Wallet `onChange` fires only on actual delta != 0; `load` ignores unknown keys silently.

### @trembus/logger

Structured, tag-based logging. Level filter is module-level global state.

- **Logger class** (`logger.ts`) — instance per-tag.
  - Static: `create(tag)`, `setGlobalLevel(level)`, `setTagLevel(tag, level)`, `clearTagLevel(tag)`.
  - Instance: `debug`, `info`, `warn`, `error`, `divider`, `header(title)`, `table(Map)`, `list(items)`, `group(label)` / `groupEnd()`, `success(msg)`, `fail(msg)`.
  - Indent state is per-instance; `group` increments, `groupEnd` decrements (clamped at 0).
  - Aliases `robloxPrint`/`robloxWarn` before class declaration to avoid method shadowing.
- **LogFilter namespace** (`log-filter.ts`) — global level + per-tag overrides. `setGlobalLevel`, `getGlobalLevel`, `setTagLevel`, `clearTagLevel`, `clearAllTagLevels`, `getEffectiveLevel(tag)`, `shouldEmit(tag, messageLevel) → boolean`.
- **Formatter namespace** (`formatter.ts`) — stateless string builders: `divider`, `header`, `tableLines`, `listLines`, `successLine`, `failLine`.
- **Types**: `LogLevel = "debug"|"info"|"warn"|"error"`, `LoggerConfig`.
- **Constants**: `LEVEL_PRIORITY` (map), `DEFAULT_GLOBAL_LEVEL = "info"`, `DIVIDER_CHAR="="`, `DIVIDER_WIDTH=50`, `SUCCESS_PREFIX="[OK]"`, `FAIL_PREFIX="[FAIL]"`.
- **Implicit contracts**: module-level state (globalLevel, tagLevels) is shared across all loggers in the VM. Level-filtering `shouldEmit` returns true when messagePriority >= effective.

### @trembus/persistent-data

Type-safe player data persistence wrapping `@rbxts/profile-store`. Ships both a base profile shape and a composable-slice system.

- **Types** (`types.ts`) — `BasePlayerProfile { version, displayName, firstJoin, lastLogin, playtime, currencies: Map<string,number>, settings, redeemedCodes }`, `ProfileSettings { musicVolume, sfxVolume, graphicsQuality, showDamageNumbers, hideOtherPlayers }`, `Migration<T>`, `MigrationMap<T>`. Runtime validators via `@rbxts/t`: `isProfileSettings`, `isBasePlayerProfile`.
- **Constants** (`constants.ts`) — `DEFAULT_STORE_NAME="PlayerData"`, `CURRENT_SCHEMA_VERSION=1`, `PROFILE_KEY_PREFIX="Player_"`, `DEFAULT_SETTINGS`, `DEFAULT_PROFILE_TEMPLATE`.
- **PersistentDataManager class** (`persistent-data.ts`) — server-side owner.
  - Constructor: `(storeName, template, config?)` with `config.migrations`, `config.currentVersion`, `config.onLoad`.
  - `loadProfile(player)` — async via `task.spawn`. Starts session, handles leave-during-load, runs migrations, `Reconcile()`, runs per-slice `onLoad`, stamps displayName/lastLogin/firstJoin. On session-end handler kicks player with "session was ended by another server".
  - `releaseProfile(player)` — accumulates playtime delta into `profile.Data.playtime` before `EndSession`.
  - `getProfile(player) → T?` — returns Data only if session is active.
  - `modifyData(player, cb) → boolean` — safe mutation; warns if no active profile.
  - `releaseAll()` — lifecycle hook for game-closing.
  - `getActiveCount() → number`.
- **PersistenceSlice interface** (`slice.ts`) — `{ sliceKey, versionKey, currentVersion, template, migrations: Map<number, (data) => data> }`. Type-only contract; no runtime code.
- **composeProfile** (`compose.ts`) — merges multiple slice templates into base, returns `{ template, onLoad }`. onLoad runs per-slice migrations by reading each slice's `versionKey` from profile and sequentially applying migrators until `currentVersion` is reached. Stamps version at end.
- **migrateProfile** (`migrations.ts`) — global migration runner. Reads `data.version`, walks `migrations` map one-by-one, increments version even on missing entries.
- **Implicit contracts**:
  - `loadProfile` may kick the player; callers cannot assume the Player object survives the call.
  - `releaseProfile` mutates `playtime` — order matters: read `lastLogin` *before* updating.
  - `modifyData` returns false and warns when session is inactive; callers should treat this as a hard no-op.
  - Raw `print`/`warn` throughout (no @trembus/logger integration).

### @trembus/rbx-ui

Roblox React UI component library — design tokens + 11 components + 3 screen templates + RPG view-model types.

- **Types** (`types.ts`) — RPG-specific view models:
  - Combat: `ResourceData { id, label, current, max, color: "health"|"mana"|"stamina" }`, `AbilityData`, `CombatEntityData`, `DamagePopup`.
  - Character: `CharacterStat { id, label, base, allocated }`, `DerivedStat { id, label, value }`, `CharacterData { name, className, domain, level, xp, xpToNext, availablePoints, stats, derived }`.
  - Inventory: `ItemRarity = "common"|"uncommon"|"rare"|"epic"` (4 levels), `ItemCategory`, `ItemData`, `RARITY_COLORS: Record<ItemRarity, {r,g,b}>`.
- **Design system** (`design-system/`):
  - `Tokens.ts` — color palettes (`BG`, `BORDER`, `AMBER`, `TACTICAL`, `SIGNAL`, `INTEL`, `PURPLE`, `STAT`, `TEXT`), typography (`FONTS`, `FONT_SIZE`), `SPACING`, `RADII`, `ColorIntent` union + `INTENT_COLORS`, `withAlpha` helper. Design language commented as "Tactical Futurism — X-COM precision + Fallout warmth".
  - `StatusIntentMap.ts` — 70+ status strings → ColorIntent. Domain-agnostic + many Trembus-internal labels (Flamework, HR, Chip Factory, etc.). `getIntent(status): ColorIntent`.
- **Components** (`components/*.tsx`) — PascalCase React TSX files:
  - Atoms: `StatusBadge`, `ResourceBar`, `AbilitySlot`, `ItemSlot`.
  - Molecules: `PlayerFrame`, `TargetFrame`, `ControllerCard`.
  - Organisms: `WindowPanel`, `StatDisplay`, `SlideControl`, `GamePanel`.
- **Screens** (`screens/*.tsx`) — `CombatHUD`, `CharacterSheet`, `InventoryPanel` with their Props types.
- **Invariants**: tokens are `as const`; `getIntent` falls back to `"neutral"` for unknown statuses.

### @trembus/rig-spawner

Character-rig catalog + spawner. Plain classes (no Flamework decorators despite package.json description); games wrap in their own `@Service`.

- **Types** (`types.ts`) — `Faction` enum (Blood/Decay/Fateless/Robots/Spirit), `RigEntry { rigId, displayName, faction, modelTemplate }`, `SpawnConfig { parent?, spawnTag?, humanoidConfig?, attributes? }`, `HumanoidConfig { maxHealth, health, walkSpeed, jumpPower, displayName }`.
- **RigCatalog** (`rig-catalog.ts`) — registry.
  - `scanFolder(container) → count` — expects `container/FactionName/Model` structure; skips non-folders, skips models without Humanoid, warns on unknown faction folder.
  - `register(entry)`, `get(rigId) → RigEntry?`, `getAll`, `getByFaction`, `has`, `size`.
  - `toRigId`: lowercases + converts `_` to `-`.
- **RigSpawner** (`rig-spawn-service.ts`) — owns a catalog + Map<Model, string>.
  - `initialize() → count` — auto-scans `ServerStorage."Asset Package - RIGS"`, warns if missing.
  - `spawnRig(rigId, Vector3, config?) → Model?` — clones template, PivotTo position, writes 6 attributes (`rigId`, `faction`, `spawnTime`, `spawnX/Y/Z`), applies humanoidConfig, applies custom attributes, adds CollectionService tag, parents.
  - `despawnRig(model)`, `despawnAll`, `getRigCatalog`, `getRigsByFaction`, `getRigEntry`, `registerRig`, `scanFolder`, `getSpawnedCount`.
- **SpawnedRigMeta namespace** (`spawned-rig-component.ts`) — reads back attributes: `getRigId`, `getFaction`, `getSpawnPosition` (reconstructs Vector3 from 3 components), `getSpawnTime`, `getAge`, `isSpawnedRig`.
- **Constants**: `DEFAULT_RIG_PACKAGE_NAME="Asset Package - RIGS"`, `DEFAULT_SPAWN_TAG="SpawnedRig"`, `FACTION_FOLDER_MAP`.
- **Implicit contracts**: Attributes `spawnX/Y/Z` are 3 separate numbers because Roblox `AttributeValue` doesn't support Vector3. `displayName` in HumanoidConfig is a misnomer — the code sets `DisplayDistanceType`, never `DisplayName`. **Likely bug** — flagged in diagnosis.
- **Side effects**: uses raw `print`/`warn`, not @trembus/logger.

### @trembus/slotable-items

Unified RPG inventory: item types, slot management, loadouts, network operation types, persistence slice.

- **Foundation types** (`types.ts`) — `ITEM_RARITY_KEYS` (6 levels: Common..Mythic), `ItemRarityKey`, `UIDisplayMeta { displayName, description, icon }`, `StatModifiers = Partial<Record<string, number>>` (stringly-typed keys).
- **Slot system** (`slot-types.ts`) — category keys (`Equipment`, `Accessory`, `SoulGem`, `Ability`, `Consumable`), per-category slot key arrays, `UniversalSlotTypeKey` union, `ALL_SLOT_TYPE_KEYS`, utilities `getSlotCategory`, `isStrictSlotType` (Equipment only), `isItemCompatibleWithSlot`, `getCompatibleSlots`.
- **Base types / mixins** (`base-types.ts`) — `RARITY_SORT_ORDER`. Capability mixins: `StatModifiable`, `PassiveGranting`, `AbilityGranting`, `Stackable`. `BaseSlotableCatalogEntry` + `BaseSlotableInstance`. Drag-drop: `SlotDragPayload`, `SlotDropResult`, `SlotDropFailureReason`. Utilities: `canItemFitInSlot`, `getSlotCategoryFromSlotType`, `hasStatModifiers`/`hasPassiveEffects`/`hasGrantedAbilities`/`isStackable` type guards.
- **Equipment** (`equipment-types.ts`) — `WeaponType` (8 values), `ArmorType` (4 values), `PassiveEffectType` (10 values), `PassiveEffectConfig`, set-bonus types, `EquipmentCatalogEntry`, `EquipmentItemInstance`, `EquipmentLoadout` (7 slots: Head/Chest/Legs/Feet/Hands/MainHand/OffHand). Factory `createEquipmentInstance`, migration helper `migrateEquipmentInstance`.
  - **Note**: `EquipmentCatalogEntry` re-declares BaseSlotable fields rather than extending — growth-ring inconsistency.
- **Accessories** (`accessory-types.ts`) — `AccessoryType` (6), 2-slot loadout. `AccessoryCatalogEntry extends BaseSlotableCatalogEntry, StatModifiable, Partial<PassiveGranting>, Partial<AbilityGranting>` — uses mixins.
- **Consumables** (`consumable-types.ts`) — `InstantEffectType` (6), `InstantEffectConfig`, `TemporaryBuffConfig`, 3-slot loadout. Stack helpers `addToConsumableStack` / `removeFromConsumableStack`. Extends `BaseSlotableCatalogEntry, Stackable`.
- **Abilities** (`ability-types.ts`) — `AbilityTargetingMode` (6), `AbilityEffectType` (6), `AbilitySchool` (4), dual loadouts: `AbilityLoadout` (key-based) and `AbilityInstanceLoadout` (instance-based), 5 slots.
  - **Note**: `AbilityCatalogEntry` also re-declares BaseSlotable fields — same inconsistency as Equipment.
- **Soul Gems** (`soul-gem-types.ts`) — `SoulGemEffectType` (10 values; 9 overlap with PassiveEffectType, different by "StatBoost" vs "AuraEffect"). Per-effect tagged-union configs (`RegenerativeShieldConfig` … `OnHitProcConfig`). `SoulGemCatalogEntry`, `SoulGemItemInstance`, 3-slot loadout, `RegenerativeShieldState` runtime type, `SoulGemActiveEffects` aggregate runtime type, `getUnlockedSoulGemSlots(playerLevel, thresholds)`.
  - **Note**: `SoulGemCatalogEntry` also re-declares BaseSlotable fields.
- **Unified inventory** (`inventory.ts`) — `AnySlotableInstance` union, `UnifiedLoadout`, `UnifiedInventorySnapshot { loadout, backpack, learnedAbilities, backpackCapacity }`, `DEFAULT_UNIFIED_INVENTORY` (capacity 100), query helpers `findItemByGuid`, `getItemsByCategory`, `countTotalItems`, `validateDragDrop`, `InventoryOperationType`, `InventoryOperationResult`.
- **Operations** (`operations.ts`) — request/result types for `Equip`, `Unequip`, `Swap`, `Grant`, `Remove`, `Activate`. Sync payloads (`UnifiedInventorySyncPayload`, `SlotUpdatePayload`). `LoadoutOperationFailureReason` (15 values) — the lingua franca for network responses.
- **Persistence slice** (`persistence.ts`) — `INVENTORY_PERSISTENCE_SLICE`. sliceKey `"inventory"`, versionKey `"inventoryVersion"`.
- **Implicit contracts**: ALL modifier keys are strings; consumers cast to their own MasterStatKey. Equipment uses strict per-slot matching; all other categories use "any slot within category". Drag-drop validation is synchronous and pure.

### @trembus/stats

Two-tier stat system: primary attributes + derived stats, formula-based derivation, resource pools, persistence slice.

- **Types** (`types.ts`) — `PRIMARY_ATTRIBUTE_KEYS` (5: Strength, Agility, Intellect, Vitality, Luck), `DERIVED_STAT_KEYS` (11: maxHealth, maxMana, maxStamina, attack, defense, speed, critRate, critDamage, healthRegen, manaRegen, staminaRegen). `MasterStatKey = PrimaryAttributeKey | DerivedStatKey`, `MASTER_STAT_KEYS`. Structures `PrimaryAttributes`, `DerivedStats`, `FinalStats = Primary & Derived`. Modifiers: `StatModifierMap = Partial<Record<MasterStatKey, number>>`, `ModifierSource { label, modifiers }`. Derivation: `DerivationFormula = (attrs, level) => number`, `DerivationConfig = Record<DerivedStatKey, DerivationFormula>`. Runtime: `ResourcePoolState { current, max, regenPerSecond }`.
- **Defaults** (`defaults.ts`) — `DEFAULT_BASE_ATTRIBUTES` (all 5s), `DEFAULT_DERIVATION_CONFIG` (opinionated RPG formulas; at level 1 all 5s → maxHealth≈100, maxMana≈63, attack≈11, critRate≈0.06).
- **Calculator** (`calculator.ts`) — pure pipeline.
  - `createModifierSource(label, modifiers) → ModifierSource`.
  - `mergeModifiers(sources[]) → StatModifierMap` — additive sum.
  - `applyAttributeModifiers(base, merged) → PrimaryAttributes`.
  - `deriveStats(attrs, level, overrides?) → DerivedStats`.
  - `applyDerivedModifiers(derived, merged) → DerivedStats`.
  - `calculateFinalStats(baseAttrs, level, sources[], overrides?) → FinalStats` — 5-step pipeline.
- **Resource pools** (`resource-pool.ts`):
  - `ResourcePool` — single pool. `constructor(max, regenPerSecond, startFull=true)`, accessors `getCurrent`/`getMax`/`getRegenPerSecond`, queries `isFull`/`isEmpty`/`percent`/`snapshot`, mutations `tick(dt)` (clamped regen), `spend(amount) → actualSpent` (partial spend allowed), `restore(amount) → actualRestored` (clamped), `fill`, `drain`, `setMax` (clamps current), `setRegenRate`, `setCurrent` (clamps).
  - `ResourcePoolSet` — health/mana/stamina trio built from `DerivedStats`. `updateFromStats(stats)` — recalculates max/regen, clamps current. `tickAll(dt)`, `fillAll()`.
- **Persistence slice** (`persistence.ts`) — `STATS_PERSISTENCE_SLICE`. sliceKey `"stats"`, versionKey `"statsVersion"`. Data: `{ baseAttributes, unspentAttributePoints, level, statsVersion }`. Pure allocation helpers: `allocateAttributePoint(data, attr) → data?` (undefined if no points), `respecAttributes(data) → data`, `totalAllocatedPoints(data) → number`.
- **Implicit contracts**: All modifier math is additive except regenMultiplier (multiplicative) and percentDamageReduction (diminishing). Partial derivation override leaves un-overridden keys on defaults.

### @trembus/status-effects

Generic status-effect runtime: stacking rules, damage calcs, shield processing, effect aggregation, buff tracking. No internal @trembus deps.

- **Types** (`types.ts`):
  - `EffectType` (10 values; explicitly comments "aligned with slotable-items PassiveEffectType by convention").
  - `StackingRule = "additive"|"multiplicative"|"diminishing"|"highest"`.
  - `EffectSource { sourceId, sourceType, catalogId? }` — provenance.
  - `PassiveEffect { type, magnitude, source, cooldownSec?, procChance?, durationSec?, radiusStuds? }` — richer than `PassiveEffectConfig` from slotable-items/equipment-types (adds `source`).
  - `ShieldState { sourceId, currentShield, maxShield, cooldownSeconds, regenPerSecond, isOnCooldown, cooldownEndTime? }` — runtime.
  - `ActiveEffects { shields, statBonuses: Map<string,number>, lifeStealPercent, damageReflectPercent, speedBoostPercent, regenMultiplier, critChanceBonus, critDamageBonus, flatDamageReduction, percentDamageReduction }` — aggregated.
  - `BuffInstance { id, buffId, source, effects, statModifiers?, durationSec, startTime, stackCount, maxStacks, refreshOnReuse }` — uses `os.clock()` timestamps.
  - `BuffConfig` — input shape for `applyBuff`.
- **Stacking rules** (`stacking.ts`) — pure. `stackAdditive`, `stackMultiplicative`, `stackDiminishing` (formula: `1 - (1-current)*(1-add)`), `stackHighest`.
- **Damage calcs** (`damage-calc.ts`) — `calculateLifeStealHealing`, `calculateReflectedDamage`, `applyDamageReduction(incoming, flat, percent)` — flat first, then percent; floored at 0.
- **Shield system** (`shield.ts`) — `processShieldDamage(shields, damage) → { remainingDamage, updatedShields }` (sequential absorb; depleted shield enters cooldown with `os.clock()+cooldownSeconds`), `updateShieldRegeneration(shields, dt)` (cooldown expiry refills; passive regen clamped to max).
- **Aggregator** (`aggregator.ts`) — `createDefaultActiveEffects()`, `aggregateEffects(effects[]) → ActiveEffects` (switches on `effect.type`; some fields reuse `procChance` / `durationSec` for non-obvious purposes — noted below), `mergeActiveEffects(a, b) → ActiveEffects`.
  - **Note**: ElementalAffinity, OnHitProc, AuraEffect are in the EffectType enum but silently ignored by aggregateEffects (comment: "consumers handle these").
  - **Overloaded field reuse**: `CriticalEnhance` uses `procChance` as crit-damage-bonus; `DamageReduction` uses `magnitude` as flat-reduction and `procChance` as percent-reduction. This is an incidental coupling.
- **Buff tracker** (`buff-tracker.ts`) — `applyBuff`, `removeExpiredBuffs`, `removeBuffById`, `getBuffRemainingTime`, `getAggregatedBuffEffects`. Stacking/refresh semantics encoded in `applyBuff`.
- **Implicit contracts**:
  - `statBonuses` uses `Map<string, number>` — same untyped key-space as slotable-items `StatModifiers`.
  - `os.clock()` is the timing source (monotonic; survives server-time weirdness).

### @trembus/timer

Framework-agnostic timer: state machine, formatting, thresholds, global signal bus.

- **Types** (`types.ts`):
  - `TimerDirection` enum (Up, Down).
  - `TimerState` enum (Idle, Running, Paused, Completed, Destroyed).
  - `TimerFormat` enum (MinSec, MinSecTenth, HourMinSec, RawSeconds, Compact).
  - `TimerThreshold { id, time, repeating? }`.
  - `TimerOptions` (input), `ResolvedTimerConfig` (internal).
  - Payload types: `TimerTickPayload`, `TimerLifecyclePayload`, `TimerThresholdPayload`.
- **Defaults** (`defaults.ts`) — `DEFAULT_TIMER_OPTIONS`, `resolveTimerConfig(options)` (generates GUID if no id; picks `Down` if duration>0 else `Up`).
- **formatTime** (`format.ts`) — pure seconds-to-string per `TimerFormat`.
- **TimerHooks namespace** (`signals.ts`) — 9 global Signals (onTick, onStarted, onPaused, onResumed, onCompleted, onReset, onDestroyed, onThresholdReached, onLoopRestart). Every Timer instance fires both its own Signal *and* the global one.
- **Timer class** (`timer.ts`) — chainable controls `start`/`pause`/`resume`/`toggle`/`stop`/`reset`/`restart`/`addTime`/`subtractTime`/`setElapsed`/`setSpeed`, threshold `addThreshold`/`removeThreshold`, accessors `getState`/`getElapsed`/`getRemaining`/`getFraction`/`getSpeed`/`getIsRunning`, per-instance Signals mirroring TimerHooks, `destroy()` disconnects Heartbeat and Destroys all signals.
- **Implicit contracts**: `addTime` *reduces* elapsed (misleading name — sounds additive); `subtractTime` *increases* elapsed. `duration===0` → infinite/stopwatch; `getRemaining()` returns `math.huge`. Threshold fires once unless `repeating`. Uses `@rbxts/signal`. Connects to `RunService.Heartbeat`.

### @trembus/timer-ui

ScreenGui display and visual effects for @trembus/timer — a clean UI sibling pattern.

- **Types** (`types.ts`):
  - `TimerAnchor` enum (9 presets: corners + edges + center).
  - `TimerEffect` enum (9 effects: Pulse/Flash/ColorShift/Shake/FadeIn/FadeOut/UrgencyGlow/CompletionBurst/ProgressRing — ProgressRing is defined but not implemented in EffectsEngine).
  - Per-effect config interfaces (`PulseConfig` … `ProgressRingConfig`).
  - `EffectEntry` = bare enum or `{ effect, config }`.
  - `TimerDisplayConfig` (18 optional fields: visible, anchor, offset, width/height, format, colors, transparency, label, effects, displayOrder).
  - `DisplayElements { screenGui, frame, timeLabel, headerLabel?, stroke? }`.
  - Re-exports `TimerFormat` from `@trembus/timer` as a convenience.
- **Defaults** (`defaults.ts`) — `ANCHOR_MAP: Record<TimerAnchor, AnchorLayout>` (computes `position` + `anchorPoint` per anchor with 12px edge margin), `DEFAULT_DISPLAY_CONFIG` (TopCenter anchor, GothamBold, MinSec format, [FadeIn, FadeOut, ColorShift] default effects), `resolveDisplayConfig(partial) → Required<TimerDisplayConfig>`.
- **TimerDisplay class** (`display.ts`) — owns a ScreenGui per timer. `show`/`hide`, `onTick(payload)` (writes timeLabel), `onCompleted()`, `updateConfig(partial)` (runtime reconfig), `getElements`, `destroy`. Builds: ScreenGui → Frame → (UICorner, UIPadding, UIListLayout, optional HeaderLabel, TimeLabel).
- **EffectsEngine class** (`effects.ts`) — per-effect tick dispatcher.
  - Lifecycle: `onShow` (FadeIn), `onHide` (FadeOut), `onCompleted` (CompletionBurst; destroys urgency stroke first), `onTick(payload)` (Pulse, Flash, ColorShift, Shake, UrgencyGlow).
  - `ProgressRing` is in the enum but NOT handled in `onTick`. Likely unfinished.
  - Effects are idempotent: Pulse/Flash only fire on second-boundary crossings (`currentSecond !== lastSecond`).
- **Implicit contracts**: `TimerDisplay` assumes it's on the client (uses `Players.LocalPlayer`); no server guard. Effect ordering is execution-order-of-the-array.

---

## Needs investigation

- **`HumanoidConfig.displayName`** (`rig-spawner/rig-spawn-service.ts:61`) is declared as a display-name override, but the code sets `DisplayDistanceType = Subject`, not `DisplayName`. Suspected bug or vestigial API.
- **`TimerEffect.ProgressRing`** — declared in the enum but `EffectsEngine.onTick` has no case for it. Intentional stub or forgotten?
- **`aggregateEffects` field overloading** — `CriticalEnhance` reads `procChance` as critDamageBonus; `DamageReduction` reads `procChance` as percentReduction. This is undocumented reuse; consumers populating these could silently get wrong behavior.
- **`rbx-ui` has zero internal @trembus deps** but its `ResourceData.color` is hardcoded to `"health"|"mana"|"stamina"` — drawn from stats package concepts. Is the package meant to stay fully decoupled, or was this just never wired up?
- **No tests detected** — `find … -name "*test*" -o -name "*spec*"` would confirm. Rebuild-phase verification (if ever reached) will need characterization-tests scaffolded from this inventory.

---

## Completeness audit

All 11 packages have every public export enumerated above. Every exported symbol at each package's `index.ts` has been placed in an inventory row (either as a named capability, a type, or a constant).

**Coverage**: 11 of 11 packages ✓. Every `index.ts` public re-export mapped ✓.
