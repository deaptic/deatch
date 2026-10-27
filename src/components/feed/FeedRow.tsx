import type { FeedEntry } from "../../lib/types/index.ts";
import type { ItemLayout } from "./item/index.ts";
import Message, { type MessageOptions } from "./message/Message.tsx";
import Event, { type EventOptions } from "./event/Event.tsx";

type Props = ItemLayout & MessageOptions & EventOptions & {
  entry: FeedEntry;
};

/// One entry, drawn by the item that fits its kind.
export default function FeedRow(props: Props) {
  const entry = props.entry;
  return entry.kind === "message"
    ? <Message {...props} item={entry} />
    : <Event {...props} item={entry} />;
}
