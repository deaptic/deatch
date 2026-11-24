import { For } from "solid-js";
import type { Fragment } from "../feed/index.ts";
import { joinLinkMentions } from "./linkMentions.ts";
import MessagePart, { type MessagePartContext } from "./MessagePart.tsx";

type Props = MessagePartContext & { fragments: Fragment[] };

export default function MessageText(props: Props) {
  return (
    <For each={joinLinkMentions(props.fragments)}>
      {(frag) => <MessagePart frag={frag} {...props} />}
    </For>
  );
}
