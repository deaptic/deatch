import { createSignal } from "solid-js";

const WINDOW_MS = 60_000;
const MAX_SAMPLES = 1000;

const samples = new Map<string, number[]>();
const [tick, setTick] = createSignal(0);

setInterval(() => setTick((t) => t + 1), 5000);

function prune(arr: number[], now: number) {
  const cutoff = now - WINDOW_MS;
  let stale = 0;
  while (stale < arr.length && arr[stale] < cutoff) stale++;
  if (stale > 0) arr.splice(0, stale);
}

export function recordChatMessage(channelId: string, timestamp: number) {
  let arr = samples.get(channelId);
  if (!arr) {
    arr = [];
    samples.set(channelId, arr);
  }
  arr.push(timestamp);
  if (arr.length > MAX_SAMPLES) prune(arr, timestamp);
}

export function messageRate(channelId: string): number {
  tick();
  const arr = samples.get(channelId);
  if (!arr) return 0;
  prune(arr, Date.now());
  return arr.length;
}
