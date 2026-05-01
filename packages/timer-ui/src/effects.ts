// ─── Timer UI: Visual Effects Engine ─────────────────────────────────────────
import { TweenService } from '@rbxts/services';
import type { TimerTickPayload } from '@trembus/timer';
import {
  type EffectEntry,
  TimerEffect,
  type ColorShiftConfig,
  type CompletionBurstConfig,
  type FadeConfig,
  type FlashConfig,
  type PulseConfig,
  type ShakeConfig,
  type UrgencyGlowConfig,
  type DisplayElements,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEffectId(entry: EffectEntry): TimerEffect {
  return typeIs(entry, 'string') ? entry : entry.effect;
}

function getEffectConfig<T>(entry: EffectEntry): T | undefined {
  if (typeIs(entry, 'string')) return undefined;
  return entry.config as unknown as T | undefined;
}

function lerpColor3(a: Color3, b: Color3, alpha: number): Color3 {
  return new Color3(
    a.R + (b.R - a.R) * alpha,
    a.G + (b.G - a.G) * alpha,
    a.B + (b.B - a.B) * alpha,
  );
}

// ─── Effects Engine ──────────────────────────────────────────────────────────

/**
 * Manages visual effects for a timer's display elements.
 */
export class EffectsEngine {
  private effects: EffectEntry[];
  private elements: DisplayElements;
  private duration: number;
  private originalPosition?: UDim2;
  private lastSecond = -1;
  private flashFrame?: Frame;

  constructor(effects: EffectEntry[], elements: DisplayElements, duration: number) {
    this.effects = effects;
    this.elements = elements;
    this.duration = duration;
    this.originalPosition = elements.frame.Position;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Called when the timer first appears.
   */
  public onShow(): void {
    for (const entry of this.effects) {
      if (getEffectId(entry) === TimerEffect.FadeIn) {
        this._applyFadeIn(getEffectConfig<FadeConfig>(entry));
      }
    }
  }

  /**
   * Called when the timer is being hidden / destroyed.
   */
  public onHide(): void {
    for (const entry of this.effects) {
      if (getEffectId(entry) === TimerEffect.FadeOut) {
        this._applyFadeOut(getEffectConfig<FadeConfig>(entry));
      }
    }
  }

  /**
   * Called when the timer completes.
   */
  public onCompleted(): void {
    // Clean up urgency glow stroke before completion effects
    if (this.elements.stroke) {
      this.elements.stroke.Destroy();
      this.elements.stroke = undefined;
    }

    for (const entry of this.effects) {
      if (getEffectId(entry) === TimerEffect.CompletionBurst) {
        this._applyCompletionBurst(getEffectConfig<CompletionBurstConfig>(entry));
      }
    }
  }

  /**
   * Called every tick with the current timer state.
   */
  public onTick(payload: TimerTickPayload): void {
    const remaining = payload.remaining;
    const fraction = payload.fraction;
    const currentSecond = math.floor(remaining);

    for (const entry of this.effects) {
      const id = getEffectId(entry);

      switch (id) {
        case TimerEffect.Pulse:
          this._tickPulse(remaining, currentSecond, getEffectConfig<PulseConfig>(entry));
          break;
        case TimerEffect.Flash:
          this._tickFlash(remaining, currentSecond, getEffectConfig<FlashConfig>(entry));
          break;
        case TimerEffect.ColorShift:
          this._tickColorShift(fraction, getEffectConfig<ColorShiftConfig>(entry));
          break;
        case TimerEffect.Shake:
          this._tickShake(remaining, getEffectConfig<ShakeConfig>(entry));
          break;
        case TimerEffect.UrgencyGlow:
          this._tickUrgencyGlow(fraction, getEffectConfig<UrgencyGlowConfig>(entry));
          break;
      }
    }

    this.lastSecond = currentSecond;
  }

  /**
   * Cleans up any effect-created instances.
   */
  public destroy(): void {
    if (this.flashFrame) {
      this.flashFrame.Destroy();
      this.flashFrame = undefined;
    }
    if (this.elements.stroke) {
      this.elements.stroke.Destroy();
      this.elements.stroke = undefined;
    }
  }

  // ── Effect Implementations ───────────────────────────────────────────────

  private _applyFadeIn(cfg?: FadeConfig): void {
    const dur = cfg?.duration ?? 0.3;
    const style = cfg?.easingStyle ?? Enum.EasingStyle.Quad;
    const frame = this.elements.frame;

    frame.BackgroundTransparency = 1;
    for (const child of frame.GetChildren()) {
      if (child.IsA('TextLabel')) {
        (child as TextLabel).TextTransparency = 1;
      }
    }
    TweenService.Create(frame, new TweenInfo(dur, style, Enum.EasingDirection.Out), {
      BackgroundTransparency:
        (this.elements.frame.GetAttribute('OriginalBgTransparency') as number) ?? 0.5,
    }).Play();
    for (const child of frame.GetChildren()) {
      if (child.IsA('TextLabel')) {
        TweenService.Create(
          child as TextLabel,
          new TweenInfo(dur, style, Enum.EasingDirection.Out),
          {
            TextTransparency: 0,
          },
        ).Play();
      }
    }
  }

  private _applyFadeOut(cfg?: FadeConfig): void {
    const dur = cfg?.duration ?? 0.3;
    const style = cfg?.easingStyle ?? Enum.EasingStyle.Quad;
    const frame = this.elements.frame;

    TweenService.Create(frame, new TweenInfo(dur, style, Enum.EasingDirection.In), {
      BackgroundTransparency: 1,
    }).Play();
    for (const child of frame.GetChildren()) {
      if (child.IsA('TextLabel')) {
        TweenService.Create(
          child as TextLabel,
          new TweenInfo(dur, style, Enum.EasingDirection.In),
          {
            TextTransparency: 1,
          },
        ).Play();
      }
    }
  }

  private _applyCompletionBurst(cfg?: CompletionBurstConfig): void {
    const scaleMult = cfg?.scale ?? 1.4;
    const shouldFade = cfg?.fadeAfter ?? true;
    const frame = this.elements.frame;

    const sizeConstraint = frame.FindFirstChildOfClass('UISizeConstraint');
    if (sizeConstraint) sizeConstraint.Destroy();

    const originalSize = frame.Size;
    const burstSize = new UDim2(
      originalSize.X.Scale * scaleMult,
      originalSize.X.Offset * scaleMult,
      originalSize.Y.Scale * scaleMult,
      originalSize.Y.Offset * scaleMult,
    );

    TweenService.Create(
      frame,
      new TweenInfo(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
      {
        Size: burstSize,
      },
    ).Play();

    task.delay(0.2, () => {
      TweenService.Create(
        frame,
        new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
        {
          Size: originalSize,
          BackgroundTransparency: shouldFade ? 1 : frame.BackgroundTransparency,
        },
      ).Play();
      if (shouldFade) {
        for (const child of frame.GetChildren()) {
          if (child.IsA('TextLabel')) {
            TweenService.Create(
              child as TextLabel,
              new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
              {
                TextTransparency: 1,
              },
            ).Play();
          }
        }
      }
    });
  }

  private _tickPulse(remaining: number, currentSecond: number, cfg?: PulseConfig): void {
    const threshold = cfg?.thresholdSeconds ?? math.huge;
    if (remaining > threshold) return;
    if (currentSecond === this.lastSecond) return;

    const scaleMult = cfg?.scale ?? 1.15;
    const label = this.elements.timeLabel;
    const originalSize = label.TextSize;
    const pulsedSize = math.floor(originalSize * scaleMult);

    label.TextSize = pulsedSize;
    task.delay(0.15, () => {
      label.TextSize = originalSize;
    });
  }

  private _tickFlash(remaining: number, currentSecond: number, cfg?: FlashConfig): void {
    if (currentSecond === this.lastSecond) return;

    const flashColor = cfg?.color ?? new Color3(1, 1, 1);
    const flashOpacity = cfg?.opacity ?? 0.3;
    const flashDuration = cfg?.duration ?? 0.15;

    if (!this.flashFrame) {
      this.flashFrame = new Instance('Frame');
      this.flashFrame.Name = 'TimerFlash';
      this.flashFrame.Size = UDim2.fromScale(1, 1);
      this.flashFrame.Position = UDim2.fromScale(0, 0);
      this.flashFrame.BackgroundColor3 = flashColor;
      this.flashFrame.BackgroundTransparency = 1;
      this.flashFrame.ZIndex = 10;
      this.flashFrame.Parent = this.elements.frame;
    }

    this.flashFrame.BackgroundColor3 = flashColor;
    this.flashFrame.BackgroundTransparency = 1 - flashOpacity;
    TweenService.Create(
      this.flashFrame,
      new TweenInfo(flashDuration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      { BackgroundTransparency: 1 },
    ).Play();
  }

  private _tickColorShift(fraction: number, cfg?: ColorShiftConfig): void {
    const safeColor = cfg?.safeColor ?? new Color3(1, 1, 1);
    const warningColor = cfg?.warningColor ?? new Color3(1, 1, 0);
    const criticalColor = cfg?.criticalColor ?? new Color3(1, 0, 0);
    const warningThreshold = cfg?.warningThreshold ?? 0.5;
    const criticalThreshold = cfg?.criticalThreshold ?? 0.85;

    let resultColor: Color3;
    if (fraction < warningThreshold) {
      resultColor = safeColor;
    } else if (fraction < criticalThreshold) {
      const alpha = (fraction - warningThreshold) / (criticalThreshold - warningThreshold);
      resultColor = lerpColor3(safeColor, warningColor, alpha);
    } else {
      const alpha = math.min(1, (fraction - criticalThreshold) / (1 - criticalThreshold));
      resultColor = lerpColor3(warningColor, criticalColor, alpha);
    }

    this.elements.timeLabel.TextColor3 = resultColor;
  }

  private _tickShake(remaining: number, cfg?: ShakeConfig): void {
    const threshold = cfg?.thresholdSeconds ?? 5;
    const maxIntensity = cfg?.intensity ?? 4;

    if (remaining > threshold || !this.originalPosition) {
      if (this.originalPosition) {
        this.elements.frame.Position = this.originalPosition;
      }
      return;
    }

    const intensity = maxIntensity * (1 - remaining / threshold);
    const offsetX = (math.random() * 2 - 1) * intensity;
    const offsetY = (math.random() * 2 - 1) * intensity;

    this.elements.frame.Position = new UDim2(
      this.originalPosition.X.Scale,
      this.originalPosition.X.Offset + offsetX,
      this.originalPosition.Y.Scale,
      this.originalPosition.Y.Offset + offsetY,
    );
  }

  private _tickUrgencyGlow(fraction: number, cfg?: UrgencyGlowConfig): void {
    const threshold = cfg?.threshold ?? 0.7;
    const glowColor = cfg?.color ?? new Color3(1, 0, 0);
    const maxSize = cfg?.maxSize ?? 6;

    if (fraction < threshold) {
      if (this.elements.stroke) {
        this.elements.stroke.Thickness = 0;
      }
      return;
    }

    if (!this.elements.stroke) {
      const stroke = new Instance('UIStroke');
      stroke.Name = 'UrgencyGlow';
      stroke.Color = glowColor;
      stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border;
      stroke.Thickness = 0;
      stroke.Parent = this.elements.frame;
      this.elements.stroke = stroke;
    }

    const alpha = (fraction - threshold) / (1 - threshold);
    this.elements.stroke.Color = glowColor;
    this.elements.stroke.Thickness = maxSize * alpha;
  }
}
