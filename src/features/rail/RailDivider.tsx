import { Show } from "solid-js";
import { appearanceRailExpanded } from "../../lib/stores/preferences.ts";

export default function RailDivider(props: { label?: string }) {
  return (
    <Show
      when={props.label}
      fallback={<div aria-hidden class="h-1 shrink-0" />}
    >
      {(label) => (
        <p
          aria-hidden={!appearanceRailExpanded()}
          class={`mx-4 h-4 shrink-0 min-w-0 flex items-center text-micro uppercase text-ink-faint truncate whitespace-nowrap transition-opacity duration-settle ${
            appearanceRailExpanded() ? "opacity-100" : "opacity-0"
          }`}
        >
          {label()}
        </p>
      )}
    </Show>
  );
}
