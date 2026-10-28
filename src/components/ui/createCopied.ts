import { createSignal, onCleanup } from "solid-js";
import * as clipboard from "../../lib/services/clipboard.ts";

const SHOW_MS = 1200;

export function createCopied() {
  const [copied, setCopied] = createSignal(false);
  let timer: number | undefined;
  onCleanup(() => clearTimeout(timer));

  async function copy(text: string) {
    if (!(await clipboard.write(text))) return;
    setCopied(true);
    clearTimeout(timer);
    timer = window.setTimeout(() => setCopied(false), SHOW_MS);
  }

  return { copied, copy };
}
