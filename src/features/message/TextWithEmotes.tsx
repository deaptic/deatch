import { For } from "solid-js";
import * as browser from "../../platform/browser.ts";
import { type EmoteMap } from "../emotes/index.ts";
import { onMiddleClick, preventAutoscroll } from "../../kit/middleClick.ts";
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
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              browser.open(segment.url);
            }}
            onAuxClick={onMiddleClick(() => browser.open(segment.url))}
            onMouseDown={preventAutoscroll}
            class="text-accent-ink hover:underline break-all"
          >
            {segment.url}
          </a>
        ) : (
          segment.text
        )
      }
    </For>
  );
}
