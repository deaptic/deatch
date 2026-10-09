import { createSignal } from "solid-js";

const TICK_MS = 1_000;

const [time, setTime] = createSignal(Date.now());

export function now(): number {
  return time();
}

export function start(): () => void {
  const id = setInterval(() => setTime(Date.now()), TICK_MS);
  return () => clearInterval(id);
}
