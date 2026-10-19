import { For } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import { emoteZoom } from "../../../lib/utils/emoteZoom.ts";
import {
  onMiddleClick,
  preventAutoscroll,
} from "../../../lib/utils/middleClick.ts";
import { INLINE_EMOTE } from "./inlineEmote.ts";
import { textSegments } from "./textSegments.ts";

export default function TextWithEmotes(
  props: { text: string; emotes: EmoteMap },
) {
  return (
    <For each={textSegments(props.text, props.emotes)}>
      {(segment) =>
        segment.kind === "emote"
          ? (
            <img
              src={segment.url}
              {...emoteZoom(segment.url)}
              alt={segment.name}
              title={segment.name}
              decoding="async"
              class={INLINE_EMOTE}
            />
          )
          : segment.kind === "link"
          ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openUrl(segment.url);
              }}
              onAuxClick={onMiddleClick(() => openUrl(segment.url))}
              onMouseDown={preventAutoscroll}
              class="text-accent-ink hover:underline break-all"
            >
              {segment.url}
            </a>
          )
          : <span class="text-ink">{segment.text}</span>}
    </For>
  );
}
