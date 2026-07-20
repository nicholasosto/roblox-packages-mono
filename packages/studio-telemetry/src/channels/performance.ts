import { Stats, RunService } from '@rbxts/services';
import { enqueue } from '../http/client';
import { registerPoll } from '../util/polling';

const METRICS_INTERVAL = 2;

let frameCount = 0;
let totalDelta = 0;
let lastFps = 60;
let lastAvgDelta = 0;

// Track FPS via Heartbeat
RunService.Heartbeat.Connect((dt) => {
  frameCount++;
  totalDelta += dt;
});

function collectMetrics(): void {
  if (totalDelta > 0) {
    lastFps = math.floor(frameCount / totalDelta);
    lastAvgDelta = math.floor((totalDelta / frameCount) * 1000 * 100) / 100;
  }
  frameCount = 0;
  totalDelta = 0;

  enqueue({
    channel: 'metrics',
    timestamp: os.time(),
    data: {
      serverFps: lastFps,
      serverMemoryMB: math.floor(Stats.GetTotalMemoryUsageMb() * 100) / 100,
      heartbeatDeltaMs: lastAvgDelta,
      instanceCount: Stats.InstanceCount,
    },
  });
}

/** Register performance metrics polling at 2-second intervals. */
export function startPerformanceChannel(): void {
  registerPoll(METRICS_INTERVAL, collectMetrics);
}
