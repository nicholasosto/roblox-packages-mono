import { RunService, Stats } from '@rbxts/services';
import { enqueue } from '../http/client';
import { registerPoll } from '../util/polling';

// Liveness, not metrics — 5s keeps the "Studio now" card fresh while staying featherweight
// (the payload is five scalar fields).
const SESSION_INTERVAL = 5;

// os.clock() is monotonic — right for durations, unlike os.time().
const startedAt = os.clock();

/** Post the identity/liveness heartbeat for this Studio window. */
function collectSession(): void {
  enqueue({
    channel: 'session',
    timestamp: os.time(),
    data: {
      place: game.Name,
      placeId: game.PlaceId,
      mode: RunService.IsRunning() ? 'play' : 'edit',
      uptimeSeconds: math.floor(os.clock() - startedAt),
      instanceCount: Stats.InstanceCount,
    },
  });
}

/** Send one heartbeat immediately on load, then every SESSION_INTERVAL seconds. */
export function startSessionChannel(): void {
  collectSession();
  registerPoll(SESSION_INTERVAL, collectSession);
}
