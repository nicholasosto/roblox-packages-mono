// ─── Timer UI: Defaults & Config Resolver ────────────────────────────────────
import { TimerFormat } from '@trembus/timer';
import {
  TimerAnchor,
  TimerEffect,
  type TimerDisplayConfig,
} from './types';

// ─── Anchor → Position / AnchorPoint map ────────────────────────────────────

interface AnchorLayout {
  position: UDim2;
  anchorPoint: Vector2;
}

const EDGE_MARGIN = 12;

export const ANCHOR_MAP: Record<TimerAnchor, AnchorLayout> = {
  [TimerAnchor.TopLeft]: {
    position: new UDim2(0, EDGE_MARGIN, 0, EDGE_MARGIN),
    anchorPoint: new Vector2(0, 0),
  },
  [TimerAnchor.TopCenter]: {
    position: new UDim2(0.5, 0, 0, EDGE_MARGIN),
    anchorPoint: new Vector2(0.5, 0),
  },
  [TimerAnchor.TopRight]: {
    position: new UDim2(1, -EDGE_MARGIN, 0, EDGE_MARGIN),
    anchorPoint: new Vector2(1, 0),
  },
  [TimerAnchor.MiddleLeft]: {
    position: new UDim2(0, EDGE_MARGIN, 0.5, 0),
    anchorPoint: new Vector2(0, 0.5),
  },
  [TimerAnchor.Center]: {
    position: new UDim2(0.5, 0, 0.5, 0),
    anchorPoint: new Vector2(0.5, 0.5),
  },
  [TimerAnchor.MiddleRight]: {
    position: new UDim2(1, -EDGE_MARGIN, 0.5, 0),
    anchorPoint: new Vector2(1, 0.5),
  },
  [TimerAnchor.BottomLeft]: {
    position: new UDim2(0, EDGE_MARGIN, 1, -EDGE_MARGIN),
    anchorPoint: new Vector2(0, 1),
  },
  [TimerAnchor.BottomCenter]: {
    position: new UDim2(0.5, 0, 1, -EDGE_MARGIN),
    anchorPoint: new Vector2(0.5, 1),
  },
  [TimerAnchor.BottomRight]: {
    position: new UDim2(1, -EDGE_MARGIN, 1, -EDGE_MARGIN),
    anchorPoint: new Vector2(1, 1),
  },
};

// ─── Default display config ──────────────────────────────────────────────────

export const DEFAULT_DISPLAY_CONFIG: Required<TimerDisplayConfig> = {
  visible: true,
  anchor: TimerAnchor.TopCenter,
  offset: new Vector2(0, 0),
  width: 200,
  height: 60,
  format: TimerFormat.MinSec,
  textColor: new Color3(1, 1, 1),
  fontSize: 32,
  font: Enum.Font.GothamBold,
  backgroundTransparency: 0.5,
  backgroundColor: new Color3(0, 0, 0),
  cornerRadius: 8,
  label: '',
  labelFontSize: 14,
  effects: [TimerEffect.FadeIn, TimerEffect.FadeOut, TimerEffect.ColorShift],
  displayOrder: 10,
};

// ─── Config resolver ─────────────────────────────────────────────────────────

/**
 * Merges partial display config with defaults.
 */
export function resolveDisplayConfig(partial: TimerDisplayConfig): Required<TimerDisplayConfig> {
  return {
    visible: partial.visible ?? DEFAULT_DISPLAY_CONFIG.visible,
    anchor: partial.anchor ?? DEFAULT_DISPLAY_CONFIG.anchor,
    offset: partial.offset ?? DEFAULT_DISPLAY_CONFIG.offset,
    width: partial.width ?? DEFAULT_DISPLAY_CONFIG.width,
    height: partial.height ?? DEFAULT_DISPLAY_CONFIG.height,
    format: partial.format ?? DEFAULT_DISPLAY_CONFIG.format,
    textColor: partial.textColor ?? DEFAULT_DISPLAY_CONFIG.textColor,
    fontSize: partial.fontSize ?? DEFAULT_DISPLAY_CONFIG.fontSize,
    font: partial.font ?? DEFAULT_DISPLAY_CONFIG.font,
    backgroundTransparency:
      partial.backgroundTransparency ?? DEFAULT_DISPLAY_CONFIG.backgroundTransparency,
    backgroundColor: partial.backgroundColor ?? DEFAULT_DISPLAY_CONFIG.backgroundColor,
    cornerRadius: partial.cornerRadius ?? DEFAULT_DISPLAY_CONFIG.cornerRadius,
    label: partial.label ?? DEFAULT_DISPLAY_CONFIG.label,
    labelFontSize: partial.labelFontSize ?? DEFAULT_DISPLAY_CONFIG.labelFontSize,
    effects: partial.effects ?? DEFAULT_DISPLAY_CONFIG.effects,
    displayOrder: partial.displayOrder ?? DEFAULT_DISPLAY_CONFIG.displayOrder,
  };
}
