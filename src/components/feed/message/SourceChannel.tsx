import { createEffect, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { FeedMessage, UserRef } from "../../../lib/types/index.ts";
import * as users from "../../../lib/services/users.ts";
import { knownUser } from "../../../lib/stores/users.ts";
import {
  onMiddleClick,
  preventAutoscroll,
} from "../../../lib/utils/middleClick.ts";
import { channelUrl } from "../../../lib/utils/twitchUrl.ts";

type Props = {
  source: NonNullable<FeedMessage["source"]>;
  /// Round on a chatter tile; square among the badges.
  round?: boolean;
  onOpen?: (channelId: string) => void;
  onContextMenu?: (x: number, y: number, identity: Partial<UserRef>) => void;
};

/// The channel a shared chat message was sent in, as a badge tile.
export default function SourceChannel(props: Props) {
  createEffect(() => {
    users.get([props.source.id]).catch((e) =>
      console.warn("shared chat channel lookup failed", e)
    );
  });

  const name = () => props.source.name || props.source.login;

  return (
    <span
      title={`Sent in ${name()}'s chat`}
      onClick={(e) => {
        if (!props.onOpen) return;
        e.stopPropagation();
        props.onOpen(props.source.id);
      }}
      onContextMenu={(e) => {
        if (!props.onContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        props.onContextMenu(e.clientX, e.clientY, {
          id: props.source.id,
          login: props.source.login,
          displayName: props.source.name,
        });
      }}
      onAuxClick={onMiddleClick(() => openUrl(channelUrl(props.source.login)))}
      onMouseDown={preventAutoscroll}
      class={`feed-badge grid overflow-hidden bg-ink/15 cursor-pointer ${
        props.round ? "rounded-full" : "rounded-xs"
      }`}
    >
      <Show when={knownUser(props.source.id)?.profileImageUrl}>
        {(src) => (
          <img src={src()} alt={name()} class="size-full object-cover" />
        )}
      </Show>
    </span>
  );
}
