import { For, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { EmoteMap } from "../../lib/stores/emotes.ts";
import type { Fragment } from "../../lib/types/index.ts";
import type { UserRef } from "../../lib/types/twitch/user.ts";

const INLINE_EMOTE =
  "inline-block feed-emote w-auto object-contain align-middle mx-px";

const URL_RE = /^https?:\/\/\S+$/;

type Props = {
  frag: Fragment;
  emotes: EmoteMap;
  mentionsYou?: boolean;
  onShowUserCard?: (x: number, y: number, identity: Partial<UserRef>) => void;
  onUserContextMenu?: (
    x: number,
    y: number,
    identity: Partial<UserRef>,
  ) => void;
};

function TextWithEmotes(props: { text: string; emotes: EmoteMap }) {
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

export default function FeedMessageFragment(props: Props) {
  const frag = props.frag;
  switch (frag.type) {
    case "emote":
      return (
        <img
          src={`https://static-cdn.jtvnw.net/emoticons/v2/${frag.id}/default/dark/1.0`}
          alt={frag.text}
          title={frag.text}
          decoding="async"
          class={INLINE_EMOTE}
        />
      );
    case "mention":
      return (
        <span
          class={`cursor-pointer hover:underline ${
            props.mentionsYou
              ? "text-accent-ink font-semibold"
              : "text-ink font-medium"
          }`}
          onClick={(e) =>
            props.onShowUserCard?.(e.clientX, e.clientY, {
              login: frag.user_login,
            })}
          onContextMenu={(e) => {
            if (!props.onUserContextMenu) return;
            e.preventDefault();
            e.stopPropagation();
            props.onUserContextMenu(e.clientX, e.clientY, {
              login: frag.user_login,
            });
          }}
          onAuxClick={(e) => {
            if (e.button !== 1) return;
            e.preventDefault();
            openUrl(`https://twitch.tv/${frag.user_login}`);
          }}
          onMouseDown={(e) => {
            if (e.button === 1) e.preventDefault();
          }}
        >
          {frag.text}
        </span>
      );
    default:
      return <TextWithEmotes text={frag.text} emotes={props.emotes} />;
  }
}
