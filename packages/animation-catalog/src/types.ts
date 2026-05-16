// ─── @trembus/animation-catalog: Type Schema ────────────────────────────────
//
// Schema for animation catalog entries. Aligned with TGL ANI CAT introduced in
// asset-conventions taxonomy.yaml v1.3.0. See:
//   - documents/conventions/animations-pipeline.md (Soul-Steel-Official project)
//   - skills/asset-conventions/templates/taxonomy.yaml (vault, library.sub_codes Animation block)

/** Lifecycle state of a catalog entry. */
export type AnimationStatus =
  | "READY"        // Verified to load + play correctly on declared compatibleRigs
  | "PLACEHOLDER"  // Triaged but not promoted; may be a scratch/blockout animation
  | "BLOCKED";     // Failed to load or fails playback verification; do not use

/** Rig topology compatibility. R15 covers most humanoid + R15-topology mech rigs. */
export type RigCompat =
  | "R15"
  | "R6"
  | "MCH_TankBot"
  | "MCH_DroneBot"
  | "MCH_Swarmer"
  | "CRE_Skeleton";

/** TGL domain values (aligned with taxonomy.yaml library.domains). */
export type Domain =
  | "shared"
  | "blood"
  | "decay"
  | "spirit"
  | "robotic"
  | "fateless";

/** Animation SUB codes from taxonomy.yaml v1.3.0. */
export type AnimSub =
  | "CST"  // Cast — windup/cast pose
  | "CMB"  // Combat — melee strike
  | "MOV"  // Movement — locomotion
  | "EMO"  // Emote — taunt/roar
  | "NPC"  // NPC behavior — chase/attack/idle/patrol
  | "ABL"  // Domain ability
  | "TRN"  // Transformation
  | "BEM"  // Beam — channeled VFX-driver
  | "KI";  // Ki — projectile windup

/** Animation priority (Roblox Enum.AnimationPriority values, as strings for serialization). */
export type AnimationPriority =
  | "Core"
  | "Idle"
  | "Movement"
  | "Action"
  | "Action2"
  | "Action3"
  | "Action4";

/**
 * A single animation entry in the catalog.
 *
 * The catalog is the source of truth for *meaning* (what does this animation do,
 * what rigs is it for, what's its current state). The master ID registry CSV is
 * the source of truth for asset IDs. The codegen script `sync-from-sources.ts`
 * keeps them aligned.
 */
export interface AnimationCatalogEntry {
  /** Dotted logical path — the stable identifier game code uses. e.g. "combat.melee.punchLeft" */
  readonly logicalName: string;

  /** Full Roblox asset reference. e.g. "rbxassetid://507767714" */
  readonly assetId: string;

  /** TGL upload name on Creator Hub. e.g. "ANI_CMB_PunchLeft_FNL" */
  readonly tglName: string;

  /** Always "ANI" (kept literal for filtering/lint clarity). */
  readonly cat: "ANI";

  /** Functional bucket per taxonomy.yaml v1.3.0. */
  readonly sub: AnimSub;

  /** Domain ownership (shared = neutral; domain-tagged = signature animation). */
  readonly domain: Domain;

  /** Rigs whose Motor6D topology this animation has been verified against. */
  readonly compatibleRigs: readonly RigCompat[];

  /** Observed length in seconds (filled by triage / qualifier service). */
  readonly lengthSec: number;

  /** Animation priority constant. Set deliberately; defaulting to Core is rarely correct. */
  readonly priority: AnimationPriority;

  /** Whether the animation should loop on Play(). */
  readonly looped: boolean;

  /** Lifecycle state (see AnimationStatus). */
  readonly status: AnimationStatus;

  /** Free-form tags for cross-cutting traits. e.g. ["dbz-style", "steel-city-m4", "scratch"] */
  readonly tags?: readonly string[];

  /** Free-form notes (rationale, known caveats, links to triage rows). */
  readonly notes?: string;
}
