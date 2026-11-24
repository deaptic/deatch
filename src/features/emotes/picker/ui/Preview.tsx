import { type JSX, Show } from "solid-js";
import type { EmoteGridItem } from "../types.ts";

type Props = {
  item: EmoteGridItem | undefined;
  detail: string;
  emptyHint: string;
  icon?: JSX.Element;
};

export default function Preview(props: Props) {
  return (
    <div class="shrink-0 h-14 flex items-center gap-3 px-3.5 border-t border-line-soft">
      <Show
        when={props.item}
        fallback={
          <span class="text-small text-ink-faint">{props.emptyHint}</span>
        }
      >
        {(item) => (
          <>
            <img src={item().url} alt="" class="size-8 object-contain" />
            <span class="flex-1 min-w-0 flex flex-col">
              <span class="text-body font-semibold text-ink truncate">
                {item().label}
              </span>
              <span class="text-small text-ink-faint truncate">
                {props.detail}
              </span>
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
  );
}
