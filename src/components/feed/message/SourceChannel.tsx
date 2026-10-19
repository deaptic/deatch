import { createEffect, Show } from "solid-js";
import type { FeedMessage } from "../../../lib/types/index.ts";
import * as users from "../../../lib/services/users.ts";
import { knownUser } from "../../../lib/stores/users.ts";
import { avatarZoom } from "../../../lib/utils/avatar.ts";
import { createChannelLink } from "../../context-menus/createChannelLink.tsx";

type Props = {
  source: NonNullable<FeedMessage["source"]>;
  /// Round on a chatter tile; square among the badges.
  round?: boolean;
  onOpen?: (channelId: string) => void;
};

/// The channel a shared chat message was sent in, as a badge tile.
export default function SourceChannel(props: Props) {
  createEffect(() => {
    users.get([props.source.id]).catch((e) =>
      console.warn("shared chat channel lookup failed", e)
    );
  });

  const name = () => props.source.name || props.source.login;
  const channel = () => knownUser(props.source.id);
  const link = createChannelLink(
    channel,
    props.onOpen && (() => props.onOpen!(props.source.id)),
  );

  return (
    <span
      title={`Sent in ${name()}'s chat`}
      {...link.handlers}
      class={`feed-badge grid overflow-hidden bg-ink/15 ${link.cursor} ${
        props.round ? "rounded-full" : "rounded-xs"
      }`}
    >
      <Show when={channel()?.profileImageUrl}>
        {(src) => (
          <img
            src={src()}
            {...avatarZoom(src())}
            alt={name()}
            class="size-full object-cover"
          />
        )}
      </Show>
      {link.menu()}
    </span>
  );
}
