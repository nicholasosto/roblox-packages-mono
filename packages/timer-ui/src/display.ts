// ─── Timer UI: ScreenGui Display Builder ─────────────────────────────────────
import { Players } from '@rbxts/services';
import { formatTime } from '@trembus/timer';
import type { TimerTickPayload } from '@trembus/timer';
import { ANCHOR_MAP, resolveDisplayConfig } from './defaults';
import { EffectsEngine } from './effects';
import { type TimerDisplayConfig, type DisplayElements } from './types';

/**
 * Manages a ScreenGui-based timer display for a single timer.
 * Created and owned by the consumer's controller on the client.
 */
export class TimerDisplay {
  private config: Required<TimerDisplayConfig>;
  private elements: DisplayElements;
  private effectsEngine?: EffectsEngine;
  private destroyed = false;

  constructor(
    timerId: string,
    displayConfig: TimerDisplayConfig,
    private readonly duration: number,
  ) {
    this.config = resolveDisplayConfig(displayConfig);
    this.elements = this._buildGui(timerId);

    if (this.config.effects.size() > 0) {
      this.effectsEngine = new EffectsEngine(this.config.effects, this.elements, this.duration);
    }

    if (this.config.visible) {
      this.show();
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  public show(): void {
    this.elements.screenGui.Enabled = true;
    this.effectsEngine?.onShow();
  }

  public hide(): void {
    this.effectsEngine?.onHide();
    task.delay(0.35, () => {
      if (!this.destroyed) {
        this.elements.screenGui.Enabled = false;
      }
    });
  }

  public onTick(payload: TimerTickPayload): void {
    if (this.destroyed) return;

    const displaySeconds = this.duration > 0 ? payload.remaining : payload.elapsed;
    this.elements.timeLabel.Text = formatTime(displaySeconds, this.config.format);

    this.effectsEngine?.onTick(payload);
  }

  public onCompleted(): void {
    this.effectsEngine?.onCompleted();
  }

  /**
   * Update display configuration at runtime.
   */
  public updateConfig(partial: Partial<TimerDisplayConfig>): void {
    const newConfig = resolveDisplayConfig({ ...this.config, ...partial });
    this.config = newConfig;
    this._applyConfig();
  }

  public getElements(): DisplayElements {
    return this.elements;
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.effectsEngine?.destroy();
    this.elements.screenGui.Destroy();
  }

  // ── Private: GUI Construction ────────────────────────────────────────────

  private _buildGui(timerId: string): DisplayElements {
    const player = Players.LocalPlayer;

    // ScreenGui
    const screenGui = new Instance('ScreenGui');
    screenGui.Name = `Timer_${timerId}`;
    screenGui.DisplayOrder = this.config.displayOrder;
    screenGui.ResetOnSpawn = false;
    screenGui.IgnoreGuiInset = true;
    screenGui.Enabled = false;
    screenGui.Parent = player.WaitForChild('PlayerGui');

    // Frame
    const anchorLayout = ANCHOR_MAP[this.config.anchor];
    const frame = new Instance('Frame');
    frame.Name = 'TimerFrame';
    frame.Size = UDim2.fromOffset(this.config.width, this.config.height);
    frame.Position = new UDim2(
      anchorLayout.position.X.Scale,
      anchorLayout.position.X.Offset + this.config.offset.X,
      anchorLayout.position.Y.Scale,
      anchorLayout.position.Y.Offset + this.config.offset.Y,
    );
    frame.AnchorPoint = anchorLayout.anchorPoint;
    frame.BackgroundColor3 = this.config.backgroundColor;
    frame.BackgroundTransparency = this.config.backgroundTransparency;
    frame.BorderSizePixel = 0;
    frame.Parent = screenGui;

    // Corner radius
    const corner = new Instance('UICorner');
    corner.CornerRadius = new UDim(0, this.config.cornerRadius);
    corner.Parent = frame;

    // Padding
    const padding = new Instance('UIPadding');
    padding.PaddingTop = new UDim(0, 4);
    padding.PaddingBottom = new UDim(0, 4);
    padding.PaddingLeft = new UDim(0, 8);
    padding.PaddingRight = new UDim(0, 8);
    padding.Parent = frame;

    // Layout
    const layout = new Instance('UIListLayout');
    layout.FillDirection = Enum.FillDirection.Vertical;
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center;
    layout.VerticalAlignment = Enum.VerticalAlignment.Center;
    layout.SortOrder = Enum.SortOrder.LayoutOrder;
    layout.Padding = new UDim(0, 2);
    layout.Parent = frame;

    // Header label (optional)
    let headerLabel: TextLabel | undefined;
    if (this.config.label !== '') {
      headerLabel = new Instance('TextLabel');
      headerLabel.Name = 'HeaderLabel';
      headerLabel.Size = new UDim2(1, 0, 0, this.config.labelFontSize + 4);
      headerLabel.BackgroundTransparency = 1;
      headerLabel.Text = this.config.label;
      headerLabel.TextColor3 = this.config.textColor;
      headerLabel.TextSize = this.config.labelFontSize;
      headerLabel.Font = this.config.font;
      headerLabel.TextXAlignment = Enum.TextXAlignment.Center;
      headerLabel.LayoutOrder = 1;
      headerLabel.Parent = frame;
    }

    // Time label
    const timeLabel = new Instance('TextLabel');
    timeLabel.Name = 'TimeLabel';
    timeLabel.Size = new UDim2(1, 0, 0, this.config.fontSize + 4);
    timeLabel.BackgroundTransparency = 1;
    timeLabel.Text = formatTime(this.duration > 0 ? this.duration : 0, this.config.format);
    timeLabel.TextColor3 = this.config.textColor;
    timeLabel.TextSize = this.config.fontSize;
    timeLabel.Font = this.config.font;
    timeLabel.TextXAlignment = Enum.TextXAlignment.Center;
    timeLabel.LayoutOrder = 2;
    timeLabel.Parent = frame;

    return {
      screenGui,
      frame,
      timeLabel,
      headerLabel,
    };
  }

  private _applyConfig(): void {
    const { frame, timeLabel, headerLabel } = this.elements;
    const anchorLayout = ANCHOR_MAP[this.config.anchor];

    frame.Size = UDim2.fromOffset(this.config.width, this.config.height);
    frame.Position = new UDim2(
      anchorLayout.position.X.Scale,
      anchorLayout.position.X.Offset + this.config.offset.X,
      anchorLayout.position.Y.Scale,
      anchorLayout.position.Y.Offset + this.config.offset.Y,
    );
    frame.AnchorPoint = anchorLayout.anchorPoint;
    frame.BackgroundColor3 = this.config.backgroundColor;
    frame.BackgroundTransparency = this.config.backgroundTransparency;

    timeLabel.TextColor3 = this.config.textColor;
    timeLabel.TextSize = this.config.fontSize;
    timeLabel.Font = this.config.font;

    if (headerLabel) {
      headerLabel.Text = this.config.label;
      headerLabel.TextSize = this.config.labelFontSize;
      headerLabel.TextColor3 = this.config.textColor;
      headerLabel.Font = this.config.font;
    }

    this.elements.screenGui.DisplayOrder = this.config.displayOrder;
  }
}
