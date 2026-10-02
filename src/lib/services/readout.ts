import { setReadout } from "../stores/readout.ts";

const VISIBLE_MS = 800;

let timer: ReturnType<typeof setTimeout> | undefined;

export function show(text: string): void {
  setReadout(text);
  clearTimeout(timer);
  timer = setTimeout(() => setReadout(null), VISIBLE_MS);
}
