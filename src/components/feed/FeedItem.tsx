import { createSignal, For, Show } from "solid-js";
import type { FeedEntry } from "../../lib/types/index.ts";
import Timestamp from "../ui/Timestamp.tsx";
import FeedAnnotation from "./FeedAnnotation.tsx";
import type { ItemLayout, ItemParts, RowTone } from "./itemParts.ts";
import {
  createMessageParts,
  type MessageOptions,
} from "./message/createMessageParts.tsx";
import {
  createEventParts,
  type EventOptions,
} from "./event/createEventParts.tsx";

type Props = ItemLayout & MessageOptions & EventOptions & {
  entry: FeedEntry;
};

const TONES: Record<RowTone, string> = {
  held: "border-caution bg-caution/12 hover:bg-caution/16",
  mention: "border-accent bg-accent-soft hover:bg-accent/18",
  cheer: "border-event-bits bg-event-bits/10 hover:bg-event-bits/14",
  redemption:
    "border-event-channel-points bg-event-channel-points/10 hover:bg-event-channel-points/14",
  first: "border-line bg-surface hover:bg-overlay",
  event: "border-(--tone) bg-(--tone)/10",
  plain: "border-transparent hover:bg-raised",
};

export default function FeedItem(props: Props) {
  const entry = props.entry;
  const parts: ItemParts = entry.kind === "message"
    ? createMessageParts(entry, props)
    : createEventParts(entry, props);

  const [hovered, setHovered] = createSignal(false);
  const active = () => hovered() || !!props.selected;
  const comfortable = () => parts.density === "comfortable";
  const columnTimestamp = () =>
    !comfortable() && props.showTimestamp ? entry.timestamp : undefined;
  const hasConnector = () =>
    parts.annotations?.some((a) => a.connector) ?? false;

  const spacing = () =>
    !comfortable()
      ? "py-1"
      : props.continued
      ? "py-0.5"
      : "mt-(--feed-group-gap) py-0.5";

  const alignment = () =>
    !comfortable()
      ? "items-start"
      : props.continued
      ? "items-baseline"
      : "items-center";

  const lead = () => (
    <Show
      when={comfortable()}
      fallback={
        <Show when={columnTimestamp()}>
          {(ts) => <Timestamp ts={ts()} variant="column" />}
        </Show>
      }
    >
      <Show
        when={!props.continued && parts.tile}
        fallback={
          <span class="w-(--chat-tile) mr-3 shrink-0 flex justify-center">
            <Timestamp ts={entry.timestamp} variant="gutter" />
          </span>
        }
      >
        {(tile) => (
          <span class="relative w-(--chat-tile) h-(--chat-two-lines) self-start shrink-0 mr-3">
            <Show when={hasConnector()}>
              <span class="absolute left-1/2 top-0 bottom-1/2 border-l-2 border-ink-faint" />
            </Show>
            <span class="absolute inset-x-0 top-1/2 -translate-y-1/2">
              {tile()(active)}
            </span>
          </span>
        )}
      </Show>
    </Show>
  );

  return (
    <div
      data-item-id={entry.kind === "message" ? entry.message_id : entry.id}
      tabIndex={-1}
      class={`relative group leading-normal pl-3 pr-2 ${spacing()} border-l-3 outline-accent transition-colors duration-snap ${
        props.flush ? "rounded-r-sm" : "rounded-sm"
      } ${TONES[parts.tone]} ${
        props.selected
          ? "outline-3 -outline-offset-3 rounded-sm"
          : "outline-none"
      } ${parts.dimmed ? "opacity-40" : ""}`}
      style={parts.toneColor ? { "--tone": parts.toneColor } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => {
        if (!parts.onContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        parts.onContextMenu(e.clientX, e.clientY);
      }}
    >
      {parts.overlay?.(hovered)}
      <For each={parts.annotations}>
        {(annotation) => (
          <FeedAnnotation
            density={parts.density}
            timestamp={columnTimestamp()}
            connector={annotation.connector}
          >
            {annotation.content}
          </FeedAnnotation>
        )}
      </For>
      <div class={`flex ${alignment()}`}>
        {lead()}
        <div class="flex-1 min-w-0 wrap-break-word">{parts.content}</div>
      </div>
    </div>
  );
}
