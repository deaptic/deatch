import { createSignal } from "solid-js";
import { setStreamerMode, streamerMode } from "../preferences/index.ts";

const [dismissed, setDismissed] = createSignal(false);
export { dismissed };

let turnedOnByStream = false;

export function dismiss(): void {
  setDismissed(true);
}

export function turnOff(): void {
  turnedOnByStream = false;
  setStreamerMode(false);
}

export function streamStarted(): void {
  if (streamerMode()) return;
  turnedOnByStream = true;
  setDismissed(false);
  setStreamerMode(true);
}

export function streamEnded(): void {
  if (!turnedOnByStream) return;
  turnedOnByStream = false;
  setStreamerMode(false);
}

export function turnedOn(): void {
  setDismissed(false);
}
