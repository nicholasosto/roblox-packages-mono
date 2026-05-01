/**
 * Example: Flamework server service wrapping @trembus/timer.
 *
 * This file is NOT compiled — it's a reference for consumers showing
 * how to integrate the timer package with Flamework on the server.
 *
 * Copy this into your game's src/server/services/ directory and adjust as needed.
 */

import { Service, type OnInit } from '@flamework/core';
import { Timer, type TimerOptions } from '@trembus/timer';

@Service()
export class TimerService implements OnInit {
  private timers = new Map<string, Timer>();

  onInit(): void {
    // Service ready
  }

  /**
   * Creates a new server-side timer.
   */
  public create(options: TimerOptions = {}): Timer {
    const timer = new Timer(options);
    this.timers.set(timer.id, timer);

    timer.onDestroyed.Connect(() => {
      this.timers.delete(timer.id);
    });

    return timer;
  }

  public get(id: string): Timer | undefined {
    return this.timers.get(id);
  }

  public remove(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      timer.destroy();
    }
  }

  public removeAll(): void {
    for (const [, timer] of this.timers) {
      timer.destroy();
    }
    this.timers.clear();
  }

  public getAll(): string[] {
    const ids: string[] = [];
    for (const [id] of this.timers) {
      ids.push(id);
    }
    return ids;
  }
}
