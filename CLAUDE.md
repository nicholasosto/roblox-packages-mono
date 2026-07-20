# Roblox Packages Mono

Monorepo for reusable roblox-ts packages under the `@trembus` scope. Each package is a standalone roblox-ts library that compiles to Luau and can be consumed by any roblox-ts game project. Packages are framework-agnostic — none import Flamework; consuming games wrap the exported classes in `@Service`/`@Controller` if they use DI.

## Stack

- **roblox-ts 3.x** — TypeScript-to-Luau compiler
- **pnpm workspace** — packages live in `packages/`
- **Volta** — node 22.22.0, pnpm 10.33.0

## Directory Structure

| Path | Purpose |
|------|---------|
| `packages/` | One directory per publishable package |
| `packages/*/src/` | TypeScript source |
| `packages/*/out/` | Compiled Luau output (git-ignored; consumers `link:` this working copy and use the local build) |

## Current Packages

| Package | Scope | Description |
|---------|-------|-------------|
| `animation-catalog` | `@trembus/animation-catalog` | Typed composable animation catalog — logical names → catalog entries with assetId, rig compatibility, length, priority, and status |
| `audio` | `@trembus/audio` | Unified audio manager — SFX pooling, music crossfading, volume/mute control |
| `currency` | `@trembus/currency` | Currency system — open registry, pure transactions, Wallet runtime, and composable persistence slice |
| `input-actions` | `@trembus/input-actions` | Multi-device input architecture — Actions, priority-stacked Contexts, and a signal-based Bus; KBM + gamepad + touch with chord support |
| `logger` | `@trembus/logger` | Structured, tag-based logging with level filtering and formatting |
| `persistent-data` | `@trembus/persistent-data` | Type-safe player data persistence wrapping @rbxts/profile-store |
| `pets-and-mounts` | `@trembus/pets-and-mounts` | Pet and mount summoning, follow behavior (AlignPosition), ride mechanics (VehicleSeat + network ownership), and ownership persistence slice |
| `rbx-ui` | `@trembus/rbx-ui` | Roblox React UI component library — design tokens, atoms, molecules, organisms, and screen-level game UIs |
| `rig-spawner` | `@trembus/rig-spawner` | Rig catalog and spawn service for character rigs |
| `slotable-items` | `@trembus/slotable-items` | Unified RPG inventory system — item types, slot management, loadouts, and network operations |
| `slotable-items-dissolved` | `@trembus/slotable-items-dissolved` | Open-taxonomy rebuild (ADR 0005) of `slotable-items` — runtime category registry; awaiting cutover, renames back to `@trembus/slotable-items` when it lands |
| `stats` | `@trembus/stats` | Two-tier stat system — primary attributes, derived stats, resource pools, and persistence slice |
| `status-effects` | `@trembus/status-effects` | Generic status effect system — shields, damage calcs, buff tracking, effect aggregation |
| `studio-telemetry` | `@trembus/studio-telemetry` | Roblox Studio plugin — batched telemetry relay to a local collector; log, game-state, performance, and entity channels (builds `TrembusStudioTelemetry.rbxm`, not a consumable lib) |
| `timer` | `@trembus/timer` | Framework-agnostic timer system — state machine, formatting, thresholds, and global signal bus |
| `timer-ui` | `@trembus/timer-ui` | Roblox ScreenGui display and visual effects for `@trembus/timer` — anchoring, color shift, pulse, shake, fade, and more |

## Commands

```bash
# Install dependencies
pnpm install

# Build / clean everything (topological order)
pnpm build
pnpm clean

# Build a specific package
pnpm --filter @trembus/<package-name> build

# Watch mode
pnpm --filter @trembus/<package-name> watch

# Clean compiled output
pnpm --filter @trembus/<package-name> clean
```

## Adding a New Package

1. Create `packages/<package-name>/` with `src/`, `package.json`, and `tsconfig.json`
2. Name it `@trembus/<package-name>` in package.json
3. Use `rbxtsc` as the build script
4. Add `@rbxts/compiler-types`, `@rbxts/types`, and `roblox-ts` as devDependencies
5. Set `"main": "out/init.lua"` and `"types": "out/index.d.ts"`
6. Run `pnpm install` from the workspace root

> Full procedure (build, publish, edge cases for Flamework/Rojo/React/internal deps): [docs/sops/adding-a-package.md](docs/sops/adding-a-package.md)

## Conventions

1. **One concern per package** — each package should do one thing well
2. **Framework-agnostic** — packages export plain classes and functions with no Flamework imports; consumers wrap them in `@Service`/`@Controller` for DI
3. **Peer dependencies** — common libs like `@rbxts/services` should be peerDependencies, not direct; internal `@trembus/*` deps use a semver peer range plus a `workspace:*` devDependency, with optional integrations marked in `peerDependenciesMeta`
4. **Type safety** — `strict: true` in all tsconfig files
5. **No game-specific logic** — packages are reusable across projects; game-specific wiring belongs in the consuming project

## SOPs

Process documents live in [`docs/sops/`](docs/sops/).

- [Adding a New Package](docs/sops/adding-a-package.md) — full procedure for scaffolding, building, publishing, and consumer-testing a new `@trembus/*` package, including the Flamework / Rojo / React / internal-dep variants

## Related

- Consumed by (via `link:` dependencies, sibling repos in `Repositories/Gaming/Roblox-Repositories/`): `../soul-steel-official` and `../roblox-testing-environment`
- **Planning space (Project-System consumer):** `~/Master-Managed/Project-Spaces/Roblox-Development/Roblox-Development-Studio/` — wraps this repo via `external-locations/code/`. ADRs live at `_project/decisions/` (ADR 0005 = `0005-open-taxonomy-slotable-items.md`); the packages-explorer dashboard lives in its `previews/`.


## Roblox Brain (roblox-dev plugin)

This repo uses the roblox-dev plugin's knowledge graph during Roblox/roblox-ts work:

- **Recall before authoring** — the roblox-brain skill auto-activates on Roblox keywords and consults the brain index (scars, patterns) before code generation; for the full neighborhood run `/roblox-dev:recall <topic>`.
- **Capture eagerly** — any bug that cost >15 minutes, or non-obvious API/toolchain behavior, gets `/roblox-dev:capture` (scar) before the task closes.
- **Conventions** — the roblox-ts skill owns TS→Luau rules + the verified toolchain matrix; the asset-conventions skill owns TGL naming.
