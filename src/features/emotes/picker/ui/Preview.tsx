import { type JSX, Show } from "solid-js";
import type { EmoteGridItem } from "../types.ts";
import Text from "../../../../kit/Text.tsx";
import Surface from "../../../../kit/Surface.tsx";

type Props = {
  item: EmoteGridItem | undefined;
  detail: string;
  emptyHint: string;
  icon?: JSX.Element;
};

export default function Preview(props: Props) {
  return (
    <Surface tone="none" edge="top" class="shrink-0">
      <div class="h-14 flex items-center gap-3 px-3.5">
        <Show
          when={props.item}
          fallback={
            <Text size="sm" tone="faint">
              {props.emptyHint}
            </Text>
          }
        >
          {(item) => (
            <>
              <img src={item().url} alt="" class="size-8 object-contain" />
              <span class="flex-1 min-w-0 flex flex-col">
                <Text size="md" bold tone="primary" truncate>
                  {item().label}
                </Text>
                <Text size="sm" tone="faint" truncate>
                  {props.detail}
                </Text>
              </span>
              <Show when={props.icon}>
                <span class="shrink-0 size-8 grid place-items-center text-ink-soft [&>svg]:size-5">
                  {props.icon}
                </span>
              </Show>
            </>
          )}
        </Show>
      </div>
    </Surface>
  );
}
