import { For } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
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
              onAuxClick={(e) => {
                if (e.button !== 1) return;
                e.preventDefault();
                openUrl(segment.url);
              }}
              onMouseDown={(e) => {
                if (e.button === 1) e.preventDefault();
              }}
              class="text-accent-ink hover:underline break-all"
            >
              {segment.url}
            </a>
          )
          : <span class="text-ink">{segment.text}</span>}
    </For>
  );
}
