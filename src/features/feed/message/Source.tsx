import { createEffect, Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import type { FeedMessage as Message } from "../../../lib/types/index.ts";
import * as users from "../../../lib/services/users.ts";
import { knownUser } from "../../../lib/stores/users.ts";
import { avatarZoom } from "../../../shared/avatar.ts";
import { createChannelLink } from "../../menus/index.ts";

export default function Source(props: {
  source: NonNullable<Message["source"]>;
  round?: boolean;
  onOpen?: (broadcasterId: string) => void;
}) {
  createEffect(() => {
    users.get([props.source.id]).catch(() => {});
  });

  const channel = () => knownUser(props.source.id);
  const name = () =>
    props.source.name || channel()?.displayName || props.source.login;
  const link = createChannelLink(
    channel,
    props.onOpen && (() => props.onOpen?.(props.source.id)),
  );

  return (
    <span
      data-tip={
        name()
          ? t("FEED_SENT_IN_CHAT_LABEL", { channel: name() })
          : t("FEED_SENT_IN_SHARED_CHAT_LABEL")
      }
      {...link.handlers}
      class={`size-feed-badge grid overflow-hidden bg-picture ${link.cursor} ${
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
