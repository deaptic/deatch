import { createSignal, onCleanup } from "solid-js";
import { copyText } from "../utils/clipboard.ts";

const SHOW_MS = 1200;

export function createCopied() {
  const [copied, setCopied] = createSignal(false);
  let timer: number | undefined;
  onCleanup(() => clearTimeout(timer));

  async function copy(text: string) {
    if (!(await copyText(text))) return;
    setCopied(true);
    clearTimeout(timer);
    timer = window.setTimeout(() => setCopied(false), SHOW_MS);
  }

  return { copied, copy };
}
