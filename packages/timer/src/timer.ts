// ─── Timer Package: Core Timer Class ─────────────────────────────────────────
import { RunService } from '@rbxts/services';
import Signal from '@rbxts/signal';
import {
  TimerDirection,
  type TimerLifecyclePayload,
  type TimerOptions,
  TimerState,
  type TimerThreshold,
  type TimerThresholdPayload,
  type TimerTickPayload,
  type ResolvedTimerConfig,
} from './types';
import { resolveTimerConfig } from './defaults';
import { TimerHooks } from './signals';

/**
 * Standalone Timer class.
 *
 * Works without Flamework — can be used in unit tests or custom setups.
 * Consumers wrap with @Service or @Controller for Flamework integration.
 */
export class Timer {
  // ── Public readonly identifiers ──────────────────────────────────────────
  public readonly id: string;
  public readonly config: ResolvedTimerConfig;

  // ── State ────────────────────────────────────────────────────────────────
  private _state: TimerState = TimerState.Idle;
  private _elapsed = 0;
  private _speed: number;
  private _connection?: RBXScriptConnection;
  private _thresholdsFired = new Set<string>();

  // ── Signals (instance-level) ─────────────────────────────────────────────
  public readonly onTick = new Signal<(payload: TimerTickPayload) => void>();
  public readonly onStarted = new Signal<(payload: TimerLifecyclePayload) => void>();
  public readonly onPaused = new Signal<(payload: TimerLifecyclePayload) => void>();
  public readonly onResumed = new Signal<(payload: TimerLifecyclePayload) => void>();
  public readonly onCompleted = new Signal<(payload: TimerLifecyclePayload) => void>();
  public readonly onReset = new Signal<(payload: TimerLifecyclePayload) => void>();
  public readonly onDestroyed = new Signal<(payload: TimerLifecyclePayload) => void>();
  public readonly onThresholdReached = new Signal<(payload: TimerThresholdPayload) => void>();
  public readonly onLoopRestart = new Signal<(payload: TimerLifecyclePayload) => void>();

  // ── Constructor ──────────────────────────────────────────────────────────

  constructor(options: TimerOptions = {}) {
    this.config = resolveTimerConfig(options);
    this.id = this.config.id;
    this._speed = this.config.speed;

    if (this.config.autoStart) {
      this.start();
    }
  }

  // ── Accessors (methods — roblox-ts does not support getters) ─────────────

  public getState(): TimerState {
    return this._state;
  }

  public getElapsed(): number {
    return this._elapsed;
  }

  public getRemaining(): number {
    if (this.config.duration <= 0) return math.huge;
    return math.max(0, this.config.duration - this._elapsed);
  }

  /** 0 → 1 progress fraction (0 if infinite) */
  public getFraction(): number {
    if (this.config.duration <= 0) return 0;
    return math.clamp(this._elapsed / this.config.duration, 0, 1);
  }

  public getSpeed(): number {
    return this._speed;
  }

  public getIsRunning(): boolean {
    return this._state === TimerState.Running;
  }

  // ── Controls (chainable) ─────────────────────────────────────────────────

  public start(): Timer {
    if (this._state === TimerState.Destroyed) return this;
    if (this._state === TimerState.Running) return this;

    this._state = TimerState.Running;
    this._connect();

    const payload = this._lifecyclePayload();
    this.onStarted.Fire(payload);
    TimerHooks.onStarted.Fire(payload);

    return this;
  }

  public pause(): Timer {
    if (this._state !== TimerState.Running) return this;

    this._state = TimerState.Paused;
    this._disconnect();

    const payload = this._lifecyclePayload();
    this.onPaused.Fire(payload);
    TimerHooks.onPaused.Fire(payload);

    return this;
  }

  public resume(): Timer {
    if (this._state !== TimerState.Paused) return this;
    return this.start();
  }

  public toggle(): Timer {
    if (this._state === TimerState.Running) return this.pause();
    if (this._state === TimerState.Paused) return this.resume();
    return this.start();
  }

  public stop(): Timer {
    if (this._state === TimerState.Destroyed) return this;
    this._state = TimerState.Completed;
    this._disconnect();

    const payload = this._lifecyclePayload();
    this.onCompleted.Fire(payload);
    TimerHooks.onCompleted.Fire(payload);

    return this;
  }

  public reset(): Timer {
    if (this._state === TimerState.Destroyed) return this;

    this._disconnect();
    this._elapsed = 0;
    this._state = TimerState.Idle;
    this._thresholdsFired.clear();

    const payload = this._lifecyclePayload();
    this.onReset.Fire(payload);
    TimerHooks.onReset.Fire(payload);

    return this;
  }

  public restart(): Timer {
    this.reset();
    return this.start();
  }

  public addTime(seconds: number): Timer {
    this._elapsed = math.max(0, this._elapsed - seconds);
    return this;
  }

  public subtractTime(seconds: number): Timer {
    this._elapsed += seconds;
    if (this.config.duration > 0 && this._elapsed >= this.config.duration) {
      this._elapsed = this.config.duration;
    }
    return this;
  }

  public setElapsed(seconds: number): Timer {
    this._elapsed = math.clamp(
      seconds,
      0,
      this.config.duration > 0 ? this.config.duration : math.huge,
    );
    return this;
  }

  public setSpeed(multiplier: number): Timer {
    this._speed = math.max(0, multiplier);
    return this;
  }

  // ── Threshold management ─────────────────────────────────────────────────

  public addThreshold(threshold: TimerThreshold): Timer {
    this.config.thresholds.push(threshold);
    return this;
  }

  public removeThreshold(id: string): Timer {
    const idx = this.config.thresholds.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.config.thresholds.remove(idx);
    }
    this._thresholdsFired.delete(id);
    return this;
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  public destroy(): void {
    if (this._state === TimerState.Destroyed) return;

    this._disconnect();
    this._state = TimerState.Destroyed;

    const payload = this._lifecyclePayload();
    this.onDestroyed.Fire(payload);
    TimerHooks.onDestroyed.Fire(payload);

    // Destroy all signals
    this.onTick.Destroy();
    this.onStarted.Destroy();
    this.onPaused.Destroy();
    this.onResumed.Destroy();
    this.onCompleted.Destroy();
    this.onReset.Destroy();
    this.onDestroyed.Destroy();
    this.onThresholdReached.Destroy();
    this.onLoopRestart.Destroy();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private _connect(): void {
    this._disconnect();
    this._connection = RunService.Heartbeat.Connect((dt) => this._tick(dt));
  }

  private _disconnect(): void {
    if (this._connection) {
      this._connection.Disconnect();
      this._connection = undefined;
    }
  }

  private _tick(dt: number): void {
    if (this._state !== TimerState.Running) return;

    this._elapsed += dt * this._speed;

    // Check thresholds
    this._checkThresholds();

    // Check completion for countdown timers
    if (this.config.duration > 0 && this._elapsed >= this.config.duration) {
      this._elapsed = this.config.duration;

      // Fire final tick
      const tickPayload = this._tickPayload();
      this.onTick.Fire(tickPayload);
      TimerHooks.onTick.Fire(tickPayload);

      if (this.config.loop) {
        // Loop restart
        this._elapsed = 0;
        this._thresholdsFired.clear();

        const loopPayload = this._lifecyclePayload();
        this.onLoopRestart.Fire(loopPayload);
        TimerHooks.onLoopRestart.Fire(loopPayload);
      } else {
        this._state = TimerState.Completed;
        this._disconnect();

        const completedPayload = this._lifecyclePayload();
        this.onCompleted.Fire(completedPayload);
        TimerHooks.onCompleted.Fire(completedPayload);
      }
      return;
    }

    // Normal tick
    const tickPayload = this._tickPayload();
    this.onTick.Fire(tickPayload);
    TimerHooks.onTick.Fire(tickPayload);
  }

  private _checkThresholds(): void {
    for (const threshold of this.config.thresholds) {
      if (this._thresholdsFired.has(threshold.id) && !threshold.repeating) continue;

      const remaining = this.config.duration > 0 ? this.config.duration - this._elapsed : 0;
      const shouldFire =
        this.config.direction === TimerDirection.Down
          ? remaining <= threshold.time
          : this._elapsed >= threshold.time;

      if (shouldFire && !this._thresholdsFired.has(threshold.id)) {
        this._thresholdsFired.add(threshold.id);

        const payload: TimerThresholdPayload = {
          timerId: this.id,
          elapsed: this._elapsed,
          threshold,
        };
        this.onThresholdReached.Fire(payload);
        TimerHooks.onThresholdReached.Fire(payload);
      }
    }
  }

  private _tickPayload(): TimerTickPayload {
    return {
      timerId: this.id,
      elapsed: this._elapsed,
      remaining: this.getRemaining(),
      fraction: this.getFraction(),
    };
  }

  private _lifecyclePayload(): TimerLifecyclePayload {
    return {
      timerId: this.id,
      elapsed: this._elapsed,
    };
  }
}
