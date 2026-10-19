import { Show } from "solid-js";
import type { FeedMessage } from "../../../lib/types/index.ts";
import { knownChatterColor } from "../../../lib/stores/users.ts";
import DisplayName from "../../ui/DisplayName.tsx";
import {
  type UserActions,
  userLink,
  userLinkHover,
} from "../../ui/userLink.ts";
import { chatterLook } from "./chatterLook.ts";
import ChatterPicture from "./ChatterPicture.tsx";

type Props = UserActions & {
  reply: NonNullable<FeedMessage["reply"]>;
  showAvatar: boolean;
  onJump?: (messageId: string) => void;
};

export default function ReplyLine(props: Props) {
  const parentColor = () => knownChatterColor(props.reply.parent_user_id) ?? "";
  const parent = () => ({
    id: props.reply.parent_user_id,
    login: props.reply.parent_user_login,
    displayName: props.reply.parent_user_name,
  });

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
      <span class="truncate" title={props.reply.parent_message_body}>
        {props.reply.parent_message_body}
      </span>
    </div>
  );
}
