import { For } from "solid-js";
import { keyLabels } from "../../lib/utils/keyboard.ts";

export default function Kbd(props: { combo: string }) {
  return (
    <span class="inline-flex items-center gap-1">
      <For each={keyLabels(props.combo)}>
        {(k) => (
          <kbd class="min-w-6.5 h-6 px-1.5 inline-grid place-items-center rounded-xs bg-raised text-small text-ink-soft font-sans">
            {k}
          </kbd>
        )}
      </For>
    </span>
  );
}
