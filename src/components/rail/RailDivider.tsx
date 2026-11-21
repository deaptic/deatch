import { Show } from "solid-js";
import { appearanceRailExpanded } from "../../lib/stores/preferences.ts";

const fade = (visible: boolean) =>
  `transition-opacity duration-settle ${visible ? "opacity-100" : "opacity-0"}`;

export default function RailDivider(props: { label?: string }) {
  return (
    <Show
      when={props.label}
      fallback={<div class="mx-4 h-px bg-line-soft shrink-0" />}
    >
      {(label) => (
        <div class="relative mx-4 h-4 shrink-0 flex items-center">
          <div
            class={`absolute inset-x-0 top-1/2 h-px bg-line-soft ${fade(!appearanceRailExpanded())}`}
          />
          <p
            aria-hidden={!appearanceRailExpanded()}
            class={`min-w-0 text-micro uppercase text-ink-faint truncate whitespace-nowrap ${fade(appearanceRailExpanded())}`}
          >
            {label()}
          </p>
        </div>
      )}
    </Show>
  );
}
