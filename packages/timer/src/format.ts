// ─── Timer Package: Time Formatting Utilities ───────────────────────────────
import { TimerFormat } from './types';

/**
 * Pads a number to at least two digits.
 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Formats a time value (in seconds) according to the given TimerFormat.
 */
export function formatTime(seconds: number, fmt: TimerFormat): string {
  const totalSeconds = math.max(0, seconds);

  switch (fmt) {
    case TimerFormat.MinSec: {
      const m = math.floor(totalSeconds / 60);
      const s = math.floor(totalSeconds % 60);
      return `${pad2(m)}:${pad2(s)}`;
    }
    case TimerFormat.MinSecTenth: {
      const m = math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      const sWhole = math.floor(s);
      const tenth = math.floor((s - sWhole) * 10);
      return `${pad2(m)}:${pad2(sWhole)}.${tenth}`;
    }
    case TimerFormat.HourMinSec: {
      const h = math.floor(totalSeconds / 3600);
      const m = math.floor((totalSeconds % 3600) / 60);
      const s = math.floor(totalSeconds % 60);
      return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }
    case TimerFormat.RawSeconds: {
      return `${math.floor(totalSeconds)}`;
    }
    case TimerFormat.Compact: {
      const m = math.floor(totalSeconds / 60);
      const s = math.floor(totalSeconds % 60);
      return `${m}:${pad2(s)}`;
    }
    default:
      return `${math.floor(totalSeconds)}`;
  }
}
