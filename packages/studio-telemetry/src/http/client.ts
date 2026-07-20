import { HttpService } from '@rbxts/services';
import type { TelemetryEnvelope } from '../types/messages';

// The local collector (tools/telemetry-collector.mjs in the Roblox-Development-Studio space).
// Port 4320 is deliberate: beside the previews server's 4319, and clear of the retired
// soul-steel dashboard's 3001. Endpoint configurability is pipeline M4.
const BASE_URL = 'http://127.0.0.1:4320';
const TELEMETRY_ENDPOINT = `${BASE_URL}/api/studio-telemetry`;

const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL = 1;

const queue: TelemetryEnvelope[] = [];
let flushing = false;

function sendPayload(url: string, payload: string): void {
  pcall(() => {
    HttpService.PostAsync(url, payload, Enum.HttpContentType.ApplicationJson, false);
  });
}

function flush(): void {
  if (flushing || queue.size() === 0) return;
  flushing = true;

  const batch = [...queue];
  queue.clear();

  for (const envelope of batch) {
    sendPayload(TELEMETRY_ENDPOINT, HttpService.JSONEncode(envelope));
  }

  flushing = false;

  // Flush again if new entries arrived while sending
  if (queue.size() > 0) {
    task.defer(flush);
  }
}

/** Enqueue a telemetry envelope for batched sending. */
export function enqueue(envelope: TelemetryEnvelope): void {
  if (queue.size() >= MAX_QUEUE_SIZE) {
    queue.remove(0); // drop oldest
  }
  queue.push(envelope);
  task.defer(flush);
}

/** Start the periodic flush loop. */
export function startFlushLoop(): void {
  task.spawn(() => {
    while (true) {
      task.wait(FLUSH_INTERVAL);
      flush();
    }
  });
}
