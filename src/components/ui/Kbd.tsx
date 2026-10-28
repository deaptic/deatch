import { For } from "solid-js";
import { keyLabels } from "../../lib/utils/keyboard.ts";

const SIZE = {
  md: "min-w-6.5 h-6 text-small text-ink-soft",
  sm: "min-w-5.5 h-5 text-micro text-ink-faint",
};

export default function Kbd(props: {
  combo: string;
  size?: keyof typeof SIZE;
}) {
  return (
    <span class="inline-flex items-center gap-1">
      <For each={keyLabels(props.combo)}>
        {(k) => (
          <kbd
            class={`px-1.5 inline-grid place-items-center rounded-xs bg-raised font-sans ${SIZE[props.size ?? "md"]}`}
          >
            {k}
          </kbd>
        )}
      </For>
    </span>
  );
}
