import { Show } from "solid-js";
import type { FeedMessage, UserRef } from "../../../lib/types/index.ts";
import {
  type UserAction,
  type UserActions,
  userLink,
  userLinkHover,
} from "../../ui/userLink.ts";
import FeedTile from "../FeedTile.tsx";
import { chatterLook } from "./chatterLook.ts";
import ChatterPicture from "./ChatterPicture.tsx";
import SourceChannel from "./SourceChannel.tsx";

type Props = UserActions & {
  chatter: UserRef;
  color: string;
  active: boolean;
  source?: FeedMessage["source"];
  onOpenSource?: (channelId: string) => void;
  onSourceContextMenu?: UserAction;
};

export default function ChatterAvatar(props: Props) {
  return (
    <span
      class={`relative shrink-0 grid ${userLinkHover(props)}`}
      {...userLink(() => props.chatter, props)}
    >
      <FeedTile round color={chatterLook(props.color).tint}>
        <ChatterPicture
          userId={props.chatter.id}
          color={props.color}
          active={props.active}
        />
      </FeedTile>
      <Show when={props.source}>
        {(source) => (
          <span class="absolute -bottom-1 -right-1 flex rounded-full ring-3 ring-canvas">
            <SourceChannel
              source={source()}
              round
              onOpen={props.onOpenSource}
              onContextMenu={props.onSourceContextMenu}
            />
          </span>
        )}
      </Show>
    </span>
  );
}
