// ─── @trembus/timer-ui: Barrel Exports ───────────────────────────────────────

// Types, enums & interfaces
export {
  TimerAnchor,
  TimerEffect,
  type TimerDisplayConfig,
  type DisplayElements,
  type PulseConfig,
  type FlashConfig,
  type ColorShiftConfig,
  type ShakeConfig,
  type FadeConfig,
  type UrgencyGlowConfig,
  type CompletionBurstConfig,
  type ProgressRingConfig,
  type EffectConfigMap,
  type EffectEntry,
} from './types';

// Defaults & config resolution
export { ANCHOR_MAP, DEFAULT_DISPLAY_CONFIG, resolveDisplayConfig } from './defaults';

// Display
export { TimerDisplay } from './display';

// Effects engine
export { EffectsEngine } from './effects';
