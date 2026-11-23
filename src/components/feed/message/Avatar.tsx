import { Show } from "solid-js";
import type {
  FeedMessage as Message,
  UserRef,
} from "../../../lib/types/index.ts";
import ChatterPicture, {
  chatterTint,
} from "../../../features/message/ChatterPicture.tsx";
import {
  type UserActions,
  userLink,
  userLinkHover,
} from "../../../features/message/userLink.ts";
import FeedItem from "../item/index.ts";
import Source from "./Source.tsx";

type Props = UserActions & {
  chatter: UserRef;
  color: string;
  source?: Message["source"];
  onOpenSource?: (broadcasterId: string) => void;
};

export default function Avatar(props: Props) {
  return (
    <span
      class={`relative shrink-0 grid ${userLinkHover(props)}`}
      {...userLink(() => props.chatter, props)}
    >
      <FeedItem.Tile round color={chatterTint(props.color)}>
        <ChatterPicture
          userId={props.chatter.id}
          name={props.chatter.displayName}
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
