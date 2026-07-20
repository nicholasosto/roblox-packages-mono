/**
 * Telemetry message types sent from the Studio plugin to the local collector
 * (tools/telemetry-collector.mjs in the Roblox-Development-Studio space).
 * The `catalog` channel mirrors the in-place ledger contract from decision
 * 0008-studio-native-lab-lane (UIStudio.Catalog attributes + UIMockups kits +
 * GenerationManifest values).
 */

/** Console log payload (matches existing StudioLogPayload) */
export interface LogPayload {
  message: string;
  /** Roblox Enum.MessageType.Value: 0=Output, 1=Info, 2=Warning, 3=Error */
  messageType: number;
  /** os.time() from Lua */
  timestamp: number;
}

/** Game state snapshot */
export interface StatePayload {
  playerCount: number;
  players: Array<{ name: string; userId: number; hasCharacter: boolean }>;
  serverUptime: number;
  loadedZones: string[];
  activeEntityCount: number;
}

/** Performance metrics */
export interface MetricsPayload {
  serverFps: number;
  serverMemoryMB: number;
  heartbeatDeltaMs: number;
  instanceCount: number;
}

/** Entity snapshot */
export interface EntityPayload {
  npcs: Array<{
    name: string;
    position: [number, number, number];
    health: number;
    maxHealth: number;
  }>;
}

/** One UIStudio.Catalog entry — its ledger attributes plus its template-instance count. */
export interface CatalogEntry {
  name: string;
  component?: string;
  state?: string;
  sourceGuiPath?: string;
  variants?: string;
  generatedBy?: string;
  harnessVersion?: number;
  /** Child count of the entry — 0 means the registry slot has no template yet (CF-3 signal). */
  templates: number;
}

/** One UIMockups kit (master ScreenGui). */
export interface KitInfo {
  name: string;
  className: string;
  descendants: number;
  hasManifest: boolean;
}

/** A GenerationManifest StringValue, verbatim. */
export interface ManifestInfo {
  path: string;
  value: string;
}

/** The lab ledger snapshot (decision 0008 contract v1). */
export interface CatalogPayload {
  /** game.Name — often the unhelpful "Place1" in Edit mode; placeId is the stable identity. */
  place: string;
  placeId: number;
  catalog: CatalogEntry[];
  kits: KitInfo[];
  manifests: ManifestInfo[];
}

/** Studio session heartbeat — who is open, in what mode, for how long. */
export interface SessionPayload {
  /** game.Name — often the unhelpful "Place1" in Edit mode; placeId is the stable identity. */
  place: string;
  placeId: number;
  /** "edit" | "play" (RunService.IsRunning during play-testing). */
  mode: string;
  /** Seconds since the plugin loaded in this Studio window. */
  uptimeSeconds: number;
  instanceCount: number;
}

/** Discriminated telemetry envelope sent to POST /api/studio-telemetry */
export type TelemetryEnvelope =
  | { channel: 'log'; timestamp: number; data: LogPayload }
  | { channel: 'state'; timestamp: number; data: StatePayload }
  | { channel: 'metrics'; timestamp: number; data: MetricsPayload }
  | { channel: 'entities'; timestamp: number; data: EntityPayload }
  | { channel: 'catalog'; timestamp: number; data: CatalogPayload }
  | { channel: 'session'; timestamp: number; data: SessionPayload };
