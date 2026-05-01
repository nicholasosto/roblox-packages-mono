// ─── Timer Package: Defaults & Config Resolver ──────────────────────────────
import { HttpService } from '@rbxts/services';
import {
  TimerDirection,
  type TimerOptions,
  type ResolvedTimerConfig,
} from './types';

// ─── Default timer options ───────────────────────────────────────────────────

export const DEFAULT_TIMER_OPTIONS: Required<TimerOptions> = {
  id: '',
  duration: 0,
  direction: TimerDirection.Down,
  autoStart: false,
  thresholds: [],
  loop: false,
  speed: 1,
  metadata: {},
};

// ─── Config resolver ─────────────────────────────────────────────────────────

/**
 * Merges user-supplied TimerOptions with defaults, generating an ID if needed.
 */
export function resolveTimerConfig(options: TimerOptions): ResolvedTimerConfig {
  const id =
    options.id !== undefined && options.id !== '' ? options.id : HttpService.GenerateGUID(false);
  const duration = options.duration ?? DEFAULT_TIMER_OPTIONS.duration;
  const direction = options.direction ?? (duration > 0 ? TimerDirection.Down : TimerDirection.Up);
  const autoStart = options.autoStart ?? DEFAULT_TIMER_OPTIONS.autoStart;
  const loop = options.loop ?? DEFAULT_TIMER_OPTIONS.loop;
  const speed = options.speed ?? DEFAULT_TIMER_OPTIONS.speed;
  const metadata = options.metadata ?? {};
  const thresholds = options.thresholds ?? [];

  return { id, duration, direction, autoStart, thresholds, loop, speed, metadata };
}
