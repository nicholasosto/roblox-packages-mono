// ─── Timer UI: Types, Enums & Interfaces ─────────────────────────────────────

/**
 * Screen anchor presets.
 */
export enum TimerAnchor {
  TopLeft = 'TopLeft',
  TopCenter = 'TopCenter',
  TopRight = 'TopRight',
  MiddleLeft = 'MiddleLeft',
  Center = 'Center',
  MiddleRight = 'MiddleRight',
  BottomLeft = 'BottomLeft',
  BottomCenter = 'BottomCenter',
  BottomRight = 'BottomRight',
}

/**
 * Visual effect identifiers.
 */
export enum TimerEffect {
  Pulse = 'Pulse',
  Flash = 'Flash',
  ColorShift = 'ColorShift',
  Shake = 'Shake',
  FadeIn = 'FadeIn',
  FadeOut = 'FadeOut',
  UrgencyGlow = 'UrgencyGlow',
  CompletionBurst = 'CompletionBurst',
  ProgressRing = 'ProgressRing',
}

// ─── Effect Config Interfaces ────────────────────────────────────────────────

export interface PulseConfig {
  /** Scale multiplier for the bounce (default 1.15) */
  scale?: number;
  /** Only pulse when remaining seconds <= this (default: always) */
  thresholdSeconds?: number;
}

export interface FlashConfig {
  /** Flash colour */
  color?: Color3;
  /** Flash opacity 0-1 */
  opacity?: number;
  /** Flash duration in seconds */
  duration?: number;
}

export interface ColorShiftConfig {
  /** Colour when time is plentiful */
  safeColor?: Color3;
  /** Colour when time is moderate */
  warningColor?: Color3;
  /** Colour when time is critical */
  criticalColor?: Color3;
  /** Fraction (0-1) of total duration at which warning begins */
  warningThreshold?: number;
  /** Fraction (0-1) of total duration at which critical begins */
  criticalThreshold?: number;
}

export interface ShakeConfig {
  /** Maximum pixel offset */
  intensity?: number;
  /** Only shake when remaining seconds <= this */
  thresholdSeconds?: number;
}

export interface FadeConfig {
  /** Fade duration in seconds */
  duration?: number;
  /** Roblox easing style */
  easingStyle?: Enum.EasingStyle;
}

export interface UrgencyGlowConfig {
  /** Glow colour */
  color?: Color3;
  /** Maximum stroke size */
  maxSize?: number;
  /** Fraction (0-1) at which glow begins */
  threshold?: number;
}

export interface CompletionBurstConfig {
  /** Scale multiplier for the burst */
  scale?: number;
  /** Whether to fade after burst */
  fadeAfter?: boolean;
}

export interface ProgressRingConfig {
  /** Ring radius in pixels */
  radius?: number;
  /** Ring thickness in pixels */
  thickness?: number;
}

/**
 * Map from effect enum to its config type.
 */
export interface EffectConfigMap {
  [TimerEffect.Pulse]: PulseConfig;
  [TimerEffect.Flash]: FlashConfig;
  [TimerEffect.ColorShift]: ColorShiftConfig;
  [TimerEffect.Shake]: ShakeConfig;
  [TimerEffect.FadeIn]: FadeConfig;
  [TimerEffect.FadeOut]: FadeConfig;
  [TimerEffect.UrgencyGlow]: UrgencyGlowConfig;
  [TimerEffect.CompletionBurst]: CompletionBurstConfig;
  [TimerEffect.ProgressRing]: ProgressRingConfig;
}

/**
 * An effect entry can be a bare enum or an object with per-effect config.
 */
export type EffectEntry =
  | TimerEffect
  | { effect: TimerEffect; config?: Partial<EffectConfigMap[TimerEffect]> };

// ─── Display Config ──────────────────────────────────────────────────────────

export interface TimerDisplayConfig {
  /** Show on-screen UI (default true) */
  visible?: boolean;
  /** Screen position preset */
  anchor?: TimerAnchor;
  /** Pixel offset from anchor */
  offset?: Vector2;
  /** Frame width in pixels */
  width?: number;
  /** Frame height in pixels */
  height?: number;
  /** Time string format */
  format?: TimerFormat;
  /** Text colour */
  textColor?: Color3;
  /** Text size */
  fontSize?: number;
  /** Font face */
  font?: Enum.Font;
  /** Frame background transparency */
  backgroundTransparency?: number;
  /** Frame background colour */
  backgroundColor?: Color3;
  /** Rounded corner radius */
  cornerRadius?: number;
  /** Header text above the time */
  label?: string;
  /** Header font size */
  labelFontSize?: number;
  /** Visual effects */
  effects?: EffectEntry[];
  /** ScreenGui display order */
  displayOrder?: number;
}

// ─── Display Elements ────────────────────────────────────────────────────────

export interface DisplayElements {
  screenGui: ScreenGui;
  frame: Frame;
  timeLabel: TextLabel;
  headerLabel?: TextLabel;
  stroke?: UIStroke;
}

// Re-export TimerFormat from the logic package for use in display config
import { TimerFormat } from '@trembus/timer';
export { TimerFormat };
