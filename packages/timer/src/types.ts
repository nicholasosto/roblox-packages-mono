// ─── Timer Package: Types, Enums & Interfaces ───────────────────────────────

/**
 * Timer count direction.
 */
export enum TimerDirection {
  Up = 'Up',
  Down = 'Down',
}

/**
 * Timer lifecycle state.
 */
export enum TimerState {
  Idle = 'Idle',
  Running = 'Running',
  Paused = 'Paused',
  Completed = 'Completed',
  Destroyed = 'Destroyed',
}

/**
 * Time display format.
 */
export enum TimerFormat {
  /** `01:30` — padded minutes:seconds */
  MinSec = 'MinSec',
  /** `01:30.5` — with one decimal */
  MinSecTenth = 'MinSecTenth',
  /** `00:01:30` — full hours:min:sec */
  HourMinSec = 'HourMinSec',
  /** `90` — integer seconds only */
  RawSeconds = 'RawSeconds',
  /** `1:30` — no leading zero on minutes */
  Compact = 'Compact',
}

// ─── Threshold ───────────────────────────────────────────────────────────────

export interface TimerThreshold {
  /** Unique identifier for this threshold */
  id: string;
  /** Time in seconds at which the threshold fires */
  time: number;
  /** If true, fires every loop cycle (default false) */
  repeating?: boolean;
}

// ─── Timer Options ───────────────────────────────────────────────────────────

export interface TimerOptions {
  /** Unique identifier (auto-generated if omitted) */
  id?: string;
  /** Total seconds. 0 = stopwatch / infinite. */
  duration?: number;
  /** Count direction */
  direction?: TimerDirection;
  /** Start immediately on creation */
  autoStart?: boolean;
  /** Time-based event triggers */
  thresholds?: TimerThreshold[];
  /** Auto-restart on completion */
  loop?: boolean;
  /** Playback speed multiplier */
  speed?: number;
  /** Arbitrary game data */
  metadata?: Record<string, unknown>;
}

// ─── Signal Payloads ─────────────────────────────────────────────────────────

export interface TimerTickPayload {
  timerId: string;
  elapsed: number;
  remaining: number;
  fraction: number;
}

export interface TimerLifecyclePayload {
  timerId: string;
  elapsed: number;
}

export interface TimerThresholdPayload {
  timerId: string;
  elapsed: number;
  threshold: TimerThreshold;
}

// ─── Resolved internal config ────────────────────────────────────────────────

export interface ResolvedTimerConfig {
  id: string;
  duration: number;
  direction: TimerDirection;
  autoStart: boolean;
  thresholds: TimerThreshold[];
  loop: boolean;
  speed: number;
  metadata: Record<string, unknown>;
}
