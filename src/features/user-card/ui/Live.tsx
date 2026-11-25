import { Users } from "lucide-solid";
import { Show } from "solid-js";
import type { Stream } from "../../../shared/types/index.ts";
import { formatCount } from "../../../shared/format/stream.ts";
import Text from "../../../kit/Text.tsx";

type Props = {
  stream: Stream | undefined;
  onOpen: () => void;
};

export default function Live(props: Props) {
  return (
    <Show when={props.stream}>
      {(stream) => (
        <button
          type="button"
          onClick={props.onOpen}
          class="-mx-card-pad px-card-pad py-2 flex flex-col gap-0.5 bg-negative text-on-accent text-sm text-left cursor-pointer pressable hover:brightness-110 active:opacity-90"
        >
          <span class="min-w-0 flex items-center gap-2">
            <Text truncate bold class="flex-1 min-w-0">
              {stream().game.name}
            </Text>
            <span class="shrink-0 flex items-center gap-1 tabular-nums">
              <Users class="size-3.5" />
              {formatCount(stream().viewerCount)}
            </span>
          </span>
          <span class="line-clamp-2 wrap-break-word opacity-90">
            {stream().title}
          </span>
        </button>
      )}
    </Show>
  );
}
