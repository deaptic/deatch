import { For } from "solid-js";
import { type EmoteMap } from "../emotes/index.ts";
import TextLink from "../../kit/TextLink.tsx";
import { previews } from "../previews/index.ts";
import { textSegments } from "./textSegments.ts";
import InlineEmote from "./InlineEmote.tsx";

export default function TextWithEmotes(props: {
  text: string;
  emotes: EmoteMap;
}) {
  return (
    <For each={textSegments(props.text, props.emotes)}>
      {(segment) =>
        segment.kind === "emote" ? (
          <InlineEmote url={segment.url} name={segment.name} />
        ) : segment.kind === "link" ? (
          <TextLink breakAll onOpen={() => previews.open(segment.url)}>
            {segment.url}
          </TextLink>
        ) : (
          segment.text
        )
      }
    </For>
  );
}
