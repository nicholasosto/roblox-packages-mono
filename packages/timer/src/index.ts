// ─── @trembus/timer: Barrel Exports ──────────────────────────────────────────

// Types, enums & interfaces
export {
  TimerDirection,
  TimerState,
  TimerFormat,
  type TimerOptions,
  type TimerThreshold,
  type TimerTickPayload,
  type TimerLifecyclePayload,
  type TimerThresholdPayload,
  type ResolvedTimerConfig,
} from './types';

// Defaults & config resolution
export { DEFAULT_TIMER_OPTIONS, resolveTimerConfig } from './defaults';

// Formatting
export { formatTime } from './format';

// Signal system
export { TimerHooks } from './signals';

// Core timer
export { Timer } from './timer';
