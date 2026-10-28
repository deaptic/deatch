import { createSignal } from "solid-js";

const WINDOW_MS = 60_000;
const MAX_SAMPLES = 1000;
const TICK_MS = 5000;

const samples = new Map<string, number[]>();
const [tick, setTick] = createSignal(0);

function prune(arr: number[], now: number) {
  const cutoff = now - WINDOW_MS;
  const firstFresh = arr.findIndex((t) => t >= cutoff);
  arr.splice(0, firstFresh === -1 ? arr.length : firstFresh);
}

export function start(): () => void {
  const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
  return () => clearInterval(id);
}

export function record(broadcasterId: string, timestamp: number) {
  let arr = samples.get(broadcasterId);
  if (!arr) {
    arr = [];
    samples.set(broadcasterId, arr);
  }
  arr.push(timestamp);
  if (arr.length > MAX_SAMPLES) prune(arr, timestamp);
}

export function clear(broadcasterId: string) {
  samples.delete(broadcasterId);
}

export function rate(broadcasterId: string): number {
  tick();
  const arr = samples.get(broadcasterId);
  if (!arr) return 0;
  prune(arr, Date.now());
  return arr.length;
}
