import { openUrl } from "@tauri-apps/plugin-opener";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type { Fragment } from "../../../lib/types/index.ts";
import type { UserRef } from "../../../lib/types/index.ts";
import { INLINE_EMOTE } from "./inlineEmote.ts";
import TextWithEmotes from "./TextWithEmotes.tsx";

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

export default function MessageFragment(props: Props) {
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
