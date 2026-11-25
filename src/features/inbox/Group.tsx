import { For, Show } from "solid-js";
import type { Mention } from "./types.ts";
import Item from "./Item.tsx";
import Text from "../../kit/Text.tsx";

type Props = {
  label: string;
  mentions: Mention[];
  onJump: (m: Mention) => void;
  onOpenChannel: (m: Mention) => void;
  onClear: (m: Mention) => void;
};

export default function Group(props: Props) {
  return (
    <Show when={props.mentions.length > 0}>
      <section class="flex flex-col gap-2">
        <div class="px-1">
          <Text as="h3" size="sm" bold tone="soft">
            {props.label}
          </Text>
        </div>
        <For each={props.mentions}>
          {(m) => (
            <Item
              mention={m}
              onJump={() => props.onJump(m)}
              onOpenChannel={() => props.onOpenChannel(m)}
              onClear={() => props.onClear(m)}
            />
          )}
        </For>
      </section>
    </Show>
  );
}
