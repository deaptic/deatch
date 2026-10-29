import { For } from "solid-js";
import type { Fragment } from "../../lib/types/index.ts";
import FragmentPiece, { type FragmentContext } from "./FragmentPiece.tsx";

type Props = FragmentContext & { fragments: Fragment[] };

/// Chat text as Twitch sends it: words, emotes, cheers, mentions and GIFs.
export default function Fragments(props: Props) {
  return (
    <For each={props.fragments}>
      {(frag) => <FragmentPiece frag={frag} {...props} />}
    </For>
  );
}
