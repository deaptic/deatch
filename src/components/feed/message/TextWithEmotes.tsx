import { For, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import { INLINE_EMOTE } from "./inlineEmote.ts";

const URL_RE = /^https?:\/\/\S+$/;

export default function TextWithEmotes(
  props: { text: string; emotes: EmoteMap },
) {
  const tokens = () => props.text.split(/(\s+)/);
  return (
    <For each={tokens()}>
      {(token) => {
        const emoteUrl = () => props.emotes[token];
        return (
          <Show
            when={emoteUrl()}
            fallback={URL_RE.test(token)
              ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openUrl(token);
                  }}
                  onAuxClick={(e) => {
                    if (e.button !== 1) return;
                    e.preventDefault();
                    openUrl(token);
                  }}
                  onMouseDown={(e) => {
                    if (e.button === 1) e.preventDefault();
                  }}
                  class="text-accent-ink hover:underline break-all"
                >
                  {token}
                </a>
              )
              : <span class="text-ink">{token}</span>}
          >
            <img
              src={emoteUrl()!}
              alt={token}
              title={token}
              decoding="async"
              class={INLINE_EMOTE}
            />
          </Show>
        );
      }}
    </For>
  );
}
