// ─── Timer Package: Signal System & Global Hooks ─────────────────────────────
import Signal from '@rbxts/signal';
import {
  type TimerTickPayload,
  type TimerLifecyclePayload,
  type TimerThresholdPayload,
} from './types';

// ─── Global event bus ────────────────────────────────────────────────────────

/**
 * Global hooks that fire for ALL timers.
 * Subscribe once to receive events from every active timer instance.
 */
export namespace TimerHooks {
  export const onTick = new Signal<(payload: TimerTickPayload) => void>();
  export const onStarted = new Signal<(payload: TimerLifecyclePayload) => void>();
  export const onPaused = new Signal<(payload: TimerLifecyclePayload) => void>();
  export const onResumed = new Signal<(payload: TimerLifecyclePayload) => void>();
  export const onCompleted = new Signal<(payload: TimerLifecyclePayload) => void>();
  export const onReset = new Signal<(payload: TimerLifecyclePayload) => void>();
  export const onDestroyed = new Signal<(payload: TimerLifecyclePayload) => void>();
  export const onThresholdReached = new Signal<(payload: TimerThresholdPayload) => void>();
  export const onLoopRestart = new Signal<(payload: TimerLifecyclePayload) => void>();
}
