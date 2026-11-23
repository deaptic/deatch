import { createSignal } from "solid-js";

const VISIBLE_MS = 800;

const [current, setCurrent] = createSignal<string | null>(null);
export { current };

let timer: ReturnType<typeof setTimeout> | undefined;

export function show(text: string): void {
  setCurrent(text);
  clearTimeout(timer);
  timer = setTimeout(() => setCurrent(null), VISIBLE_MS);
}
