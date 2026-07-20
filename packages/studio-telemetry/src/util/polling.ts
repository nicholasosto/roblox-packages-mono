import { RunService } from '@rbxts/services';

interface PollChannel {
  intervalSeconds: number;
  callback: () => void;
  elapsed: number;
}

const channels: PollChannel[] = [];

/** Register a callback to run at the given interval (in seconds). */
export function registerPoll(intervalSeconds: number, callback: () => void): void {
  channels.push({ intervalSeconds, callback, elapsed: 0 });
}

/** Start the Heartbeat-driven polling loop. */
export function startPolling(): void {
  RunService.Heartbeat.Connect((dt) => {
    for (const ch of channels) {
      ch.elapsed += dt;
      if (ch.elapsed >= ch.intervalSeconds) {
        ch.elapsed = 0;
        task.spawn(ch.callback);
      }
    }
  });
}
