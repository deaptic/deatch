import { Show } from "solid-js";
import { cheermotes, type EmoteMap } from "../../emotes/index.ts";
import { Reply, ReplyHook, withoutReplyMention } from "../../feed/index.ts";
import { feedShowAvatars, feedShowTimestamp } from "../../preferences/index.ts";
import {
  ChatterPicture,
  DisplayName,
  MessageText,
} from "../../message/index.ts";
import { user as self } from "../../users/index.ts";
import Text from "../../../kit/Text.tsx";
import Timestamp from "../../../kit/Timestamp.tsx";
import type { Mention } from "./types.ts";

type Props = {
  mention: Mention;
  emotes: EmoteMap;
  onJump: (messageId: string) => void;
};

export default function MentionRow(props: Props) {
  const msg = () => props.mention.message;
  return (
    <div class="flex flex-col text-(length:--chat-size)">
      <Show when={msg().reply}>
        {(reply) => (
          <span class="flex min-w-0">
            <Show when={feedShowAvatars()}>
              <span class="w-(--chat-tile) mr-3 shrink-0 relative">
                <ReplyHook class="-right-2" />
              </span>
            </Show>
            <span class="flex-1 min-w-0">
              <Reply
                reply={reply()}
                showAvatar={feedShowAvatars()}
                onJump={props.onJump}
              />
            </span>
          </span>
        )}
      </Show>
      <span class="flex items-start min-w-0">
        <Show when={feedShowAvatars()}>
          <span class="w-(--chat-tile) h-(--chat-two-lines) mr-3 shrink-0 flex items-center">
            <span class="size-(--chat-tile)">
              <ChatterPicture
                userId={msg().chatter_user_id}
                name={msg().chatter_name}
              />
            </span>
          </span>
        </Show>
        <span class="flex-1 min-w-0 flex flex-col">
          <span class="flex items-baseline gap-2 min-w-0">
            <Text truncate class="min-w-0">
              <DisplayName
                login={msg().chatter_login}
                displayName={msg().chatter_name}
                color={msg().color}
                userId={msg().chatter_user_id}
              />
            </Text>
            <Show when={feedShowTimestamp()}>
              <Text size="relative" tone="faint" class="shrink-0">
                <Timestamp ts={props.mention.timestamp} />
              </Text>
            </Show>
          </span>
          <Text wrap="words">
            <MessageText
              fragments={withoutReplyMention(msg())}
              emotes={props.emotes}
              cheermotes={cheermotes.forChannel(props.mention.broadcasterId)}
              you={self()?.login}
            />
          </Text>
        </span>
      </span>
    </div>
  );
}
