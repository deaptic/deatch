import { For, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { EmoteMap } from "../../lib/stores/emotes";
import type { Fragment } from "../../lib/types";

const INLINE_EMOTE =
  "inline-block h-[1.4em] w-auto max-w-[4em] object-contain align-top mt-[0.1em] mx-0.5";

const URL_RE = /^https?:\/\/\S+$/;

type UserIdentity = { userId?: string; login?: string; displayName?: string };

type Props = {
  frag: Fragment;
  emotes: EmoteMap;
  onShowUserCard?: (x: number, y: number, identity: { userId?: string; login?: string }) => void;
  onUserContextMenu?: (x: number, y: number, identity: UserIdentity) => void;
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
            fallback={
              URL_RE.test(token) ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openUrl(token);
                  }}
                  class="text-primary hover:underline break-all"
                >
                  {token}
                </a>
              ) : (
                <span class="text-text">{token}</span>
              )
            }
          >
            <img src={emoteUrl()!} alt={token} title={token} class={INLINE_EMOTE} />
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
          class={INLINE_EMOTE}
        />
      );
    case "mention":
      return (
        <span
          class="text-primary font-medium cursor-pointer hover:underline"
          onClick={(e) => props.onShowUserCard?.(e.clientX, e.clientY, { login: frag.user_login })}
          onContextMenu={(e) => {
            if (!props.onUserContextMenu) return;
            e.preventDefault();
            e.stopPropagation();
            props.onUserContextMenu(e.clientX, e.clientY, { login: frag.user_login });
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
