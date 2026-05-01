/**
 * Example: Flamework client controller wrapping @trembus/timer + @trembus/timer-ui.
 *
 * This file is NOT compiled — it's a reference for consumers showing
 * how to integrate the timer package with Flamework on the client.
 *
 * Copy this into your game's src/client/controllers/ directory and adjust as needed.
 */

import { Controller, type OnInit } from '@flamework/core';
import { Timer, type TimerOptions, type TimerTickPayload } from '@trembus/timer';
import { TimerDisplay, type TimerDisplayConfig } from '@trembus/timer-ui';

interface ManagedTimer {
  timer: Timer;
  display?: TimerDisplay;
}

@Controller()
export class TimerController implements OnInit {
  private managed = new Map<string, ManagedTimer>();

  onInit(): void {
    // Controller ready
  }

  /**
   * Creates a new client-side timer with optional display.
   */
  public create(options: TimerOptions & { display?: TimerDisplayConfig | false } = {}): Timer {
    const timer = new Timer(options);
    const managed: ManagedTimer = { timer };

    // Create display if config is provided and not false
    if (options.display !== false && options.display !== undefined) {
      const display = new TimerDisplay(
        timer.id,
        options.display,
        timer.config.duration,
      );
      managed.display = display;

      // Wire tick updates to display
      timer.onTick.Connect((payload: TimerTickPayload) => {
        display.onTick(payload);
      });

      // Wire completion
      timer.onCompleted.Connect(() => {
        display.onCompleted();
      });

      // Wire destruction
      timer.onDestroyed.Connect(() => {
        display.destroy();
      });
    }

    this.managed.set(timer.id, managed);

    timer.onDestroyed.Connect(() => {
      this.managed.delete(timer.id);
    });

    return timer;
  }

  /**
   * Quick countdown that resolves when complete.
   */
  public countdown(
    seconds: number,
    options: Omit<TimerOptions, 'duration' | 'autoStart'> & { display?: TimerDisplayConfig } = {},
  ): Promise<void> {
    return new Promise((resolve) => {
      const timer = this.create({
        ...options,
        duration: seconds,
        autoStart: true,
      });

      timer.onCompleted.Once(() => {
        task.delay(0.5, () => {
          timer.destroy();
        });
        resolve();
      });
    });
  }

  /**
   * Creates a stopwatch (count-up timer with no duration).
   */
  public stopwatch(options: Omit<TimerOptions, 'duration' | 'direction'> & { display?: TimerDisplayConfig } = {}): Timer {
    return this.create({
      ...options,
      duration: 0,
      autoStart: options.autoStart ?? true,
    });
  }

  public get(id: string): Timer | undefined {
    return this.managed.get(id)?.timer;
  }

  public getDisplay(id: string): TimerDisplay | undefined {
    return this.managed.get(id)?.display;
  }

  public updateDisplay(id: string, config: Partial<TimerDisplayConfig>): void {
    const display = this.managed.get(id)?.display;
    if (display) {
      display.updateConfig(config);
    }
  }

  public remove(id: string): void {
    const managed = this.managed.get(id);
    if (managed) {
      managed.timer.destroy();
    }
  }

  public removeAll(): void {
    for (const [, managed] of this.managed) {
      managed.timer.destroy();
    }
    this.managed.clear();
  }

  public getAll(): string[] {
    const ids: string[] = [];
    for (const [id] of this.managed) {
      ids.push(id);
    }
    return ids;
  }
}
