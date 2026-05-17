# Process Document: Adding a New @trembus Package

**Owner:** Nicholas Osto &nbsp;|&nbsp; **Last Updated:** 2026-05-16 &nbsp;|&nbsp; **Review Cadence:** Annually, or whenever the scaffolding template changes

## Purpose

Standardize how new `@trembus/*` packages are scaffolded, built, and published from this monorepo so they remain consistent with the existing packages and reliably consumable by downstream roblox-ts game projects.

A consistent process means:
- Every package follows the same file layout (no "is this the right tsconfig?" decisions per package).
- Build output is reproducible — `rbxtsc` either succeeds or it doesn't; there's no per-package toolchain drift.
- Consumers can `pnpm add @trembus/<name>` without surprises.

## Scope

**In scope**
- Deciding whether a new package is justified ("one concern per package" gate)
- Scaffolding the directory, `package.json`, `tsconfig.json`
- Wiring peer/dev/runtime dependencies, including internal `@trembus/*` deps
- First build and smoke test
- Committing source + compiled `out/` artifacts
- Updating `CLAUDE.md`'s "Current Packages" table
- Publishing to the public npm registry under the `@trembus` scope

**Out of scope**
- Designing the package's API surface (judgment call, not a procedure)
- Versioning strategy beyond initial `0.1.0` (no changesets/semver tooling wired up yet)
- Consumer-side wiring inside game projects (lives in those projects' own docs)

## Roles

Today this is a solo operation; the table is structured for future collaborators.

| Role | Today | Future |
|------|-------|--------|
| Responsible (does the work) | Nicholas | Package author |
| Accountable (owns the outcome) | Nicholas | Nicholas, as repo owner |
| Consulted (asked before merging) | — | Consumer-project maintainer |
| Informed (told after merging) | — | Downstream game devs (via release notes when added) |

## Process Flow

```
            ┌──────────────────┐
            │  Propose package │   "one concern per package" gate
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │     Scaffold     │   src/, package.json, tsconfig.json
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │  Wire dependencies│  peerDeps, devDeps, internal workspace:*
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │  Implement src/  │
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │   First build    │   pnpm install → rbxtsc
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │     Commit       │   src/ + package.json + tsconfig.json + out/
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │ Update CLAUDE.md │   "Current Packages" table
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │    npm publish   │   --access public + git tag
            └────────┬─────────┘
                     │
            ┌────────▼─────────┐
            │  Consumer smoke  │   pnpm add in a real consumer project
            └──────────────────┘
```

## Detailed Steps

### Step 1: Decide the package is justified

- **Who:** Nicholas
- **When:** Before any code is written
- **How:** Ask "what is the one thing this package does?" If the answer needs an "and," it's probably two packages. Sketch the `src/index.ts` barrel — if you can't fit the planned exports on a single screen, split.
- **Output:** A package name (kebab-case) and a one-line description.

### Step 2: Scaffold the directory

- **Who:** Nicholas
- **When:** Step 1 complete
- **How:**
  ```bash
  cd packages/
  mkdir <name>
  cd <name>
  mkdir src
  touch src/index.ts
  cp ../logger/package.json package.json
  cp ../logger/tsconfig.json tsconfig.json
  ```
  `logger` is the minimal template — no internal deps, no Flamework, no Rojo, no React.
- **Output:** `packages/<name>/{src/index.ts, package.json, tsconfig.json}` with logger's contents.

### Step 3: Edit `package.json`

- **Who:** Nicholas
- **When:** Step 2 complete
- **How:** Update these fields, leave everything else as-is from the template:
  - `name`: `@trembus/<name>`
  - `description`: one short sentence; pattern is `"<what it does> for roblox-ts games"`
  - `version`: keep at `"0.1.0"` for first publish
  - `peerDependencies`: add `@rbxts/*` libs that consumers should pick the version of
  - `devDependencies`: mirror `peerDependencies` (so local typecheck works) plus the standard four already there:
    - `@rbxts/compiler-types: 3.0.0-types.0`
    - `@rbxts/types: ^1.0.914`
    - `roblox-ts: ^3.0.0`
    - `typescript: 5.5.3`
- **Output:** A valid `package.json` for the new package.

### Step 4 (conditional): Wire internal `@trembus/*` dependencies

Apply this step if the new package needs to call into another `@trembus/*` package.

- **Who:** Nicholas
- **When:** The new package imports from another `@trembus/*` package
- **How:** In `package.json`:
  - Add the dep to `peerDependencies` with a normal semver range (e.g. `"@trembus/logger": "^0.1.0"`). Consumers manage the version.
  - Add the dep to `devDependencies` as `"workspace:*"` so local builds use the live workspace copy.

  In `tsconfig.json`, extend `typeRoots`:
  ```json
  "typeRoots": ["node_modules/@rbxts", "node_modules/@trembus"]
  ```
- **Output:** Types resolve in `src/` against the sibling package's compiled output.
- **Canonical example:** [`packages/audio`](../../packages/audio/) (depends on `@trembus/logger`)

### Step 5 (conditional): Flamework decorators

Apply this step if the new package uses `@Service`, `@Component`, or any other Flamework decorator.

- **Who:** Nicholas
- **When:** The package's intent is server-side singleton or instance-attached lifecycle behavior
- **How:** No additional config changes — Flamework reads the standard `tsconfig.json`. On the first build, `rbxtsc` will generate a `flamework.build` file at the package root. **Commit that file** — it is part of the published artifact.
- **Output:** A `flamework.build` file in the package root after first build.
- **Canonical example:** [`packages/rig-spawner`](../../packages/rig-spawner/)

### Step 6 (conditional): Rojo placement

Apply this step only if consumers should be able to drop the package's `out/` directly into a Roblox Studio location via Rojo.

- **Who:** Nicholas
- **When:** The package ships replicated instances or a known-good Studio location (most packages don't — they're plain modules)
- **How:** Add a `default.project.json` at the package root:
  ```json
  {
    "name": "<name>",
    "tree": {
      "$className": "Folder",
      "out": { "$path": "out" }
    }
  }
  ```
- **Output:** `packages/<name>/default.project.json`.
- **Canonical example:** [`packages/rbx-ui/default.project.json`](../../packages/rbx-ui/default.project.json)

### Step 7 (conditional): React / UI package

Apply this step if the package renders Roblox UI via `@rbxts/react`.

- **Who:** Nicholas
- **When:** The package's `src/` contains JSX
- **How:**
  - `peerDependencies` and `devDependencies` each need `@rbxts/react` pinned to an exact version (not caret); current standard is `"17.3.7-ts.1"`.
  - In `tsconfig.json`, add three compiler options:
    ```json
    "jsx": "react",
    "jsxFactory": "React.createElement",
    "jsxFragmentFactory": "React.Fragment"
    ```
- **Output:** JSX compiles to `React.createElement` calls in `out/`.
- **Canonical example:** [`packages/rbx-ui`](../../packages/rbx-ui/)

### Step 8: Implement `src/`

- **Who:** Nicholas
- **When:** Steps 2–7 complete
- **How:** Write the package code. Every public export must be re-exported from `src/index.ts` (barrel pattern, no exceptions — that's what `out/index.d.ts` is built from).
- **Output:** A working `src/` tree with a complete barrel export.

### Step 9: Install at the workspace root

- **Who:** Nicholas
- **When:** Step 3 complete (and revisit after step 4/7 if deps changed)
- **How:**
  ```bash
  pnpm install
  ```
  Run from the repo root, not from inside the package. This links workspace deps and writes the root `pnpm-lock.yaml`.
- **Output:** `node_modules/` populated in the new package; lockfile updated.

### Step 10: First build (smoke test)

- **Who:** Nicholas
- **When:** Step 9 complete and step 8 has at least a stub export
- **How:**
  ```bash
  pnpm --filter @trembus/<name> build
  ```
  After it finishes, verify:
  - `out/init.luau` exists
  - `out/index.d.ts` exists
  - `rbxtsc` exited 0 (no error output)
  - `flamework.build` exists if step 5 applied
- **Output:** A complete `out/` directory ready to commit.

### Step 11: Commit

- **Who:** Nicholas
- **When:** Step 10 succeeds
- **How:** Stage and commit:
  - `packages/<name>/src/`
  - `packages/<name>/package.json`
  - `packages/<name>/tsconfig.json`
  - `packages/<name>/out/` (this repo distributes precompiled Luau — `out/` is committed here even though it's `.gitignore`d in consumer projects)
  - `packages/<name>/flamework.build` if step 5 applied
  - `packages/<name>/default.project.json` if step 6 applied
  - root `pnpm-lock.yaml`
- **Output:** A clean commit that adds the package.

### Step 12: Update `CLAUDE.md`'s "Current Packages" table

- **Who:** Nicholas
- **When:** Step 11 complete, before step 13
- **How:** Open [`CLAUDE.md`](../../CLAUDE.md), find the "## Current Packages" table, add a row in the format:
  ```
  | `<name>` | `@trembus/<name>` | <one-line description> |
  ```
- **Output:** Updated `CLAUDE.md` reflecting the full package roster. This is the easiest step to forget; it's also the one that breaks discoverability when forgotten.

### Step 13: Publish to npm

- **Who:** Nicholas
- **When:** Step 12 complete
- **How:**
  ```bash
  cd packages/<name>
  npm publish --access public
  cd ../..
  git tag @trembus/<name>@0.1.0
  git push --tags
  ```
  The `--access public` flag is **required on first publish** because `@trembus` is a scoped name; without it npm defaults to private and the publish fails.
- **Output:** Package live at `https://www.npmjs.com/package/@trembus/<name>`; commit tagged.

### Step 14: Smoke test in a consumer project

- **Who:** Nicholas
- **When:** Step 13 complete
- **How:** In a consumer project (e.g. `~/GameDev/roblox-testing-environment/`):
  ```bash
  pnpm add @trembus/<name>
  pnpm build
  ```
  Then open Studio (or the consumer's test scene) and verify the package actually loads. Type-resolution at compile time is necessary but not sufficient — Luau runtime errors only show up here.
- **Output:** Confirmation the package works end-to-end. If anything breaks, revert npm publish via `npm unpublish @trembus/<name>@0.1.0` within 72 hours, fix, and re-publish as `0.1.1`.

## Exceptions and Edge Cases

| Scenario | What to do |
|----------|-----------|
| Package depends on another `@trembus/*` package | Apply step 4 (peerDep + workspace:* devDep + extended `typeRoots`). Example: `packages/audio`. |
| Package uses Flamework decorators | Apply step 5; commit the auto-generated `flamework.build`. Example: `packages/rig-spawner`. |
| Package needs a Rojo placement file | Apply step 6 (`default.project.json`). Example: `packages/rbx-ui`. |
| Package contains JSX (React UI) | Apply step 7 (`@rbxts/react` peerDep + jsx compiler options). Example: `packages/rbx-ui`. |
| Package needs a runtime-type validator like `@rbxts/t` | Add it under `dependencies` (not `devDependencies`), because the consumer shouldn't pick its version. Example: `packages/rig-spawner` has `"@rbxts/t": "^3.2.1"` under `dependencies`. |
| `rbxtsc` build fails on first run | Confirm `tsconfig.json` matches `packages/logger/tsconfig.json` exactly (apart from intentional step-4/step-7 extensions). Confirm `pnpm install` was run from the repo root, not the package directory. |
| `npm publish` fails with 403 / "private" error | First publish of a scoped name needs `--access public`. Re-run with that flag. |
| Need to rename a package after it's been published | Don't. Deprecate the old name (`npm deprecate @trembus/old-name@'*' "renamed to @trembus/new-name"`), publish under the new name, and update consumers. Renaming in-place is not supported by npm. |
| Step 12 (table update) was forgotten | Open a follow-up commit just for the table. This has happened before — the repo currently has 12 packages but the table only lists 4. |
| Need to bump a package version | Edit `version` in that package's `package.json`, rebuild, commit, `npm publish` (no `--access` flag needed after first publish), tag. No changesets tooling is wired up — discipline is manual. |

## Metrics

| Metric | Target | How to measure |
|--------|--------|----------------|
| Build green at commit time | 100% | `rbxtsc` must exit 0 before `out/` is committed; this is enforced by the human, not CI (no CI is wired up yet) |
| Time-to-first-consumer | < 1 day | Date of new package commit → date that package appears in a consumer project's `package.json` |
| Package count | Observability only | `ls packages/ \| wc -l` — no target; just track that the count and the "Current Packages" table agree |
| CLAUDE.md table drift | 0 packages missing | `diff <(ls packages/) <(grep -oE '`[a-z-]+`' CLAUDE.md table)` — currently 8 missing, see step 12 note |

## Related Documents

- [`CLAUDE.md`](../../CLAUDE.md) — repo overview, "Current Packages" table, scaffolding quick reference
- Template references:
  - [`packages/logger/`](../../packages/logger/) — minimal package (no internal deps, no Flamework, no Rojo)
  - [`packages/audio/`](../../packages/audio/) — internal-dep example (`workspace:*` + extended `typeRoots`)
  - [`packages/rig-spawner/`](../../packages/rig-spawner/) — Flamework example (`flamework.build` committed) and runtime-dep example (`@rbxts/t` under `dependencies`)
  - [`packages/rbx-ui/`](../../packages/rbx-ui/) — Rojo + React example (`default.project.json`, JSX tsconfig options)
