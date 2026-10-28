import { createEffect, Show } from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import type { FeedMessage as Message } from "../../../lib/types/index.ts";
import * as users from "../../../lib/services/users.ts";
import { knownUser } from "../../../lib/stores/users.ts";
import { avatarZoom } from "../../../lib/utils/avatar.ts";
import { createChannelLink } from "../../context-menus/createChannelLink.tsx";

/// The channel a shared chat message was sent in, as a badge tile.
export default function Source(props: {
  source: NonNullable<Message["source"]>;
  /// Round on a chatter tile; square among the badges.
  round?: boolean;
  onOpen?: (channelId: string) => void;
}) {
  createEffect(() => {
    users.get([props.source.id]).catch(() => {});
  });

  const channel = () => knownUser(props.source.id);
  // History messages carry only the channel id.
  const name = () =>
    props.source.name || channel()?.displayName || props.source.login;
  const link = createChannelLink(
    channel,
    props.onOpen && (() => props.onOpen!(props.source.id)),
  );

  return (
    <span
      data-tip={
        name()
          ? t("FEED_SENT_IN_CHAT", { channel: name() })
          : t("FEED_SENT_IN_SHARED_CHAT")
      }
      {...link.handlers}
      class={`size-feed-badge grid overflow-hidden bg-ink/15 ${link.cursor} ${
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
