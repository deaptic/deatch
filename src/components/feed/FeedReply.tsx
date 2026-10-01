import { Blobatar } from "@blobatar/solid";
import { Show } from "solid-js";
import type { Density } from "../../lib/constants/density.ts";
import type { FeedMessage } from "../../lib/types/index.ts";
import FeedAnnotation from "./FeedAnnotation.tsx";

type Props = {
  reply: NonNullable<FeedMessage["reply"]>;
  density: Density;
  timestamp?: number;
  onJump?: (messageId: string) => void;
};

export default function FeedReply(props: Props) {
  return (
    <FeedAnnotation
      density={props.density}
      timestamp={props.timestamp}
      connector
    >
      <div
        class={`flex items-center gap-1.5 min-w-0 text-ink-faint feed-meta transition-colors duration-snap ${
          props.onJump ? "cursor-pointer hover:text-ink-soft" : ""
        }`}
        onClick={() => props.onJump?.(props.reply.parent_message_id)}
      >
        <Show
          when={props.density === "comfortable" && props.reply.parent_user_id}
        >
          {(id) => (
            <span class="h-lh aspect-square shrink-0 overflow-hidden rounded-xs bg-raised">
              <Blobatar name={id()} background={false} class="size-full" />
            </span>
          )}
        </Show>
        <span class="shrink-0 font-semibold text-accent-ink">
          @{props.reply.parent_user_name}
        </span>
        <span class="truncate">{props.reply.parent_message_body}</span>
      </div>
    </FeedAnnotation>
  );
}
