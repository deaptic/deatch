import { Minus, Sparkles, TrendingUp, Wrench } from "lucide-solid";
import { For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Group } from "../../shared/changelog.ts";
import SectionLabel from "../../kit/SectionLabel.tsx";
import Text from "../../kit/Text.tsx";

const ICONS: Record<string, typeof Sparkles> = {
  New: Sparkles,
  Improved: TrendingUp,
  Fixed: Wrench,
  Removed: Minus,
};

export default function NotesGroup(props: { group: Group }) {
  return (
    <div class="flex flex-col gap-2">
      <SectionLabel>
        <span class="inline-flex items-center gap-1.5">
          <Show when={ICONS[props.group.title]}>
            {(icon) => <Dynamic component={icon()} class="size-3.5" />}
          </Show>
          {props.group.title}
        </span>
      </SectionLabel>
      <ul class="flex flex-col gap-1.5 list-disc pl-5">
        <For each={props.group.items}>
          {(item) => (
            <li>
              <Text tone="soft">{item}</Text>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
