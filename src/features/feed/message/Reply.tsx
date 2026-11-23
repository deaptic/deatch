import { Show } from "solid-js";
import type { FeedMessage as Message } from "../../../shared/types/index.ts";
import { knownChatterColor } from "../../users/index.ts";
import { t } from "../../../shared/i18n/index.ts";
import {
  ChatterPicture,
  chatterTint,
  DisplayName,
  type UserActions,
  userLink,
  userLinkHover,
} from "../../message/index.ts";
import { onActivateKey } from "../../../kit/keyActivation.ts";

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
  const threadStart = () => {
    const r = props.reply;
    if (!r.thread_message_id || r.thread_message_id === r.parent_message_id) {
      return null;
    }
    const name = r.thread_user_name || r.thread_user_login;
    return name ? { id: r.thread_message_id, name } : null;
  };

  function jumpTo(messageId: () => string) {
    const jump = props.onJump;
    if (!jump) return {};
    return {
      role: "button" as const,
      tabIndex: 0,
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        jump(messageId());
      },
      onKeyDown: onActivateKey(() => jump(messageId())),
    };
  }

  return (
    <div
      class={`flex items-center gap-1.5 min-w-0 text-ink-faint text-feed-meta transition-colors duration-snap ${
        props.onJump ? "cursor-pointer hover:text-ink-soft" : ""
      }`}
      {...jumpTo(() => props.reply.parent_message_id)}
    >
      <Show when={props.showAvatar && props.reply.parent_user_id}>
        {(id) => {
          const tint = () => chatterTint(parentColor());
          return (
            <span
              class={`h-lh aspect-square shrink-0 grid overflow-hidden rounded-full ${
                tint()
                  ? "bg-(--tile)/16 text-(--tile)"
                  : "bg-raised text-ink-soft"
              } ${userLinkHover(props)}`}
              style={tint() ? { "--tile": tint() } : undefined}
              {...userLink(parent, props)}
            >
              <ChatterPicture
                userId={id()}
                name={props.reply.parent_user_name}
              />
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
            {...jumpTo(() => thread().id)}
          >
            {t("FEED_REPLY_THREAD_LABEL", { user: thread().name })}
          </span>
        )}
      </Show>
    </div>
  );
}
