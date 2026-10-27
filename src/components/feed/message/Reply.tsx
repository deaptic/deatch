import { Show } from "solid-js";
import type { FeedMessage as Message } from "../../../lib/types/index.ts";
import { knownChatterColor } from "../../../lib/stores/users.ts";
import { t } from "../../../lib/i18n/index.ts";
import ChatterPicture, { chatterLook } from "../../ui/ChatterPicture.tsx";
import DisplayName from "../../ui/DisplayName.tsx";
import {
  type UserActions,
  userLink,
  userLinkHover,
} from "../../ui/userLink.ts";

export default function Reply(
  props: UserActions & {
    reply: NonNullable<Message["reply"]>;
    showAvatar: boolean;
    onJump?: (messageId: string) => void;
  },
) {
  const parentColor = () => knownChatterColor(props.reply.parent_user_id) ?? "";
  const parent = () => ({
    id: props.reply.parent_user_id,
    login: props.reply.parent_user_login,
    displayName: props.reply.parent_user_name,
  });
  // A direct reply to the thread's first message needs no second pointer.
  const threadStart = () => {
    const r = props.reply;
    if (!r.thread_message_id || r.thread_message_id === r.parent_message_id) {
      return null;
    }
    const name = r.thread_user_name || r.thread_user_login;
    return name ? { id: r.thread_message_id, name } : null;
  };

  return (
    <div
      class={`flex items-center gap-1.5 min-w-0 text-ink-faint feed-meta transition-colors duration-snap ${
        props.onJump ? "cursor-pointer hover:text-ink-soft" : ""
      }`}
      onClick={() => props.onJump?.(props.reply.parent_message_id)}
    >
      <Show when={props.showAvatar && props.reply.parent_user_id}>
        {(id) => {
          const look = () => chatterLook(parentColor());
          return (
            <span
              class={`h-lh aspect-square shrink-0 grid overflow-hidden rounded-full ${
                look().tint ? "bg-(--tile)/16" : "bg-raised"
              } ${userLinkHover(props)}`}
              style={look().tint ? { "--tile": look().tint } : undefined}
              {...userLink(parent, props)}
            >
              <ChatterPicture userId={id()} color={parentColor()} />
            </span>
          );
        }}
      </Show>
      <span class="shrink-0">
        <DisplayName
          prefix="@"
          login={props.reply.parent_user_login}
          displayName={props.reply.parent_user_name}
          color={parentColor()}
          userId={props.reply.parent_user_id}
          onShowUserCard={props.onShowUserCard}
          onUserContextMenu={props.onUserContextMenu}
        />
      </span>
      <span class="truncate" data-tip={props.reply.parent_message_body}>
        {props.reply.parent_message_body}
      </span>
      <Show when={threadStart()}>
        {(thread) => (
          <span
            class="shrink-0 hover:text-ink-soft"
            onClick={(e) => {
              e.stopPropagation();
              props.onJump?.(thread().id);
            }}
          >
            {t("FEED_REPLY_THREAD", { user: thread().name })}
          </span>
        )}
      </Show>
    </div>
  );
}
