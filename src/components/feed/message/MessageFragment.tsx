import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type { Fragment } from "../../../lib/types/index.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import { emoteZoom } from "../../../lib/utils/emoteZoom.ts";
import {
  type UserActions,
  userLink,
  userLinkHover,
} from "../../ui/userLink.ts";
import { INLINE_EMOTE } from "./inlineEmote.ts";
import Cheermote from "./Cheermote.tsx";
import TextWithEmotes from "./TextWithEmotes.tsx";

type Props = UserActions & {
  frag: Fragment;
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  mentionsYou?: boolean;
};

export default function MessageFragment(props: Props) {
  const frag = props.frag;
  switch (frag.type) {
    case "emote": {
      const url =
        `https://static-cdn.jtvnw.net/emoticons/v2/${frag.id}/default/dark/1.0`;
      return (
        <img
          src={url}
          {...emoteZoom(url)}
          alt={frag.text}
          title={frag.text}
          decoding="async"
          class={INLINE_EMOTE}
        />
      );
    }
    case "cheermote":
      return (
        <Cheermote
          text={frag.text}
          prefix={frag.prefix}
          bits={frag.bits}
          cheermotes={props.cheermotes}
        />
      );
    case "mention":
      return (
        <span
          class={`${userLinkHover(props)} ${
            props.mentionsYou
              ? "text-accent-ink font-semibold"
              : "text-ink font-medium"
          }`}
          {...userLink(() => ({ login: frag.user_login }), props)}
        >
          {frag.text}
        </span>
      );
    default:
      return <TextWithEmotes text={frag.text} emotes={props.emotes} />;
  }
}
