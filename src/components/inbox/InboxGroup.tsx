import { For, Show } from "solid-js";
import type { Mention } from "../../lib/stores/inbox.ts";
import InboxItem from "./InboxItem.tsx";

type Props = {
  label: string;
  mentions: Mention[];
  onJump: (m: Mention) => void;
  onClear: (m: Mention) => void;
};

export default function InboxGroup(props: Props) {
  return (
    <Show when={props.mentions.length > 0}>
      <section class="flex flex-col gap-2">
        <h3 class="px-1 text-small font-semibold text-ink-soft">
          {props.label}
        </h3>
        <For each={props.mentions}>
          {(m) => (
            <InboxItem
              mention={m}
              onJump={() => props.onJump(m)}
              onClear={() => props.onClear(m)}
            />
          )}
        </For>
      </section>
    </Show>
  );
}
