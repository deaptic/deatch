import { Show } from "solid-js";
import type {
  FeedMessage as Message,
  UserRef,
} from "../../../lib/types/index.ts";
import ChatterPicture, { chatterLook } from "../../ui/ChatterPicture.tsx";
import {
  type UserActions,
  userLink,
  userLinkHover,
} from "../../ui/userLink.ts";
import FeedItem from "../item/index.ts";
import Source from "./Source.tsx";

type Props = UserActions & {
  chatter: UserRef;
  color: string;
  active: boolean;
  source?: Message["source"];
  onOpenSource?: (channelId: string) => void;
};

/// The chatter's tile, with the shared chat channel pinned to its corner.
export default function Avatar(props: Props) {
  return (
    <span
      class={`relative shrink-0 grid ${userLinkHover(props)}`}
      {...userLink(() => props.chatter, props)}
    >
      <FeedItem.Tile round color={chatterLook(props.color).tint}>
        <ChatterPicture
          userId={props.chatter.id}
          color={props.color}
          active={props.active}
        />
      </FeedItem.Tile>
      <Show when={props.source}>
        {(source) => (
          <span class="absolute -bottom-1 -right-1 flex rounded-full ring-3 ring-canvas">
            <Source source={source()} round onOpen={props.onOpenSource} />
          </span>
        )}
      </Show>
    </span>
  );
}
