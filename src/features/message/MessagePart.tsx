import { type EmoteMap, type CheermoteMap } from "../emotes/index.ts";
import type { Fragment } from "../../lib/types/index.ts";
import { emoteUrl } from "../../lib/utils/twitchUrl.ts";
import Thumbnail from "../../kit/Thumbnail.tsx";
import Cheermote from "./Cheermote.tsx";
import InlineEmote from "./InlineEmote.tsx";
import TextWithEmotes from "./TextWithEmotes.tsx";
import { type UserActions, userLink, userLinkHover } from "./userLink.ts";

export type MessagePartContext = UserActions & {
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  mentionsYou?: boolean;
};

export default function MessagePart(
  props: MessagePartContext & { frag: Fragment },
) {
  const frag = props.frag;
  switch (frag.type) {
    case "emote":
      return <InlineEmote url={emoteUrl(frag.id)} name={frag.text} />;
    case "cheermote":
      return (
        <Cheermote
          text={frag.text}
          prefix={frag.prefix}
          bits={frag.bits}
          cheermotes={props.cheermotes}
        />
      );
    case "gif":
      return (
        <span class="block my-1">
          <Thumbnail
            src={frag.url}
            alt={frag.text}
            tip={frag.text}
            shape="native"
            fit="feed"
          />
        </span>
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
