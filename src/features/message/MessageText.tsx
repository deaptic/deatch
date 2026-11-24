import { For } from "solid-js";
import type { Fragment } from "../feed/index.ts";
import MessagePart, { type MessagePartContext } from "./MessagePart.tsx";

type Props = MessagePartContext & { fragments: Fragment[] };

export default function MessageText(props: Props) {
  return (
    <For each={props.fragments}>
      {(frag) => <MessagePart frag={frag} {...props} />}
    </For>
  );
}
