import { createEffect, createSignal, on } from "solid-js";
import Feed, { type FeedApi } from "../feed/Feed";
import ChatInput from "./ChatInput";
import type { FeedMessage as Message } from "../../types";

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  userLogin: string;
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

export default function Chat(props: Props) {
  const [replyTo, setReplyTo] = createSignal<{ messageId: string; name: string; text: string } | null>(null);

  let inputApi: { focus: () => void; insert: (text: string) => void } | undefined;
  let feedApi: FeedApi | undefined;

  createEffect(on(() => props.broadcasterId, () => {
    inputApi?.focus();
  }));

  const clearReply = () => setReplyTo(null);
  const startReply = (msg: Message) => {
    setReplyTo({
      messageId: msg.message_id,
      name: msg.chatter_name,
      text: msg.fragments.map((f) => f.text).join(""),
    });
    inputApi?.focus();
  };
  const mentionUser = (login: string) => inputApi?.insert(`@${login}`);

  return (
    <div class="flex flex-col h-full bg-bg-dark">
      <Feed
        broadcasterId={props.broadcasterId}
        broadcasterLogin={props.broadcasterLogin}
        userLogin={props.userLogin}
        onJumpToMessage={props.onJumpToMessage}
        onReply={startReply}
        onMention={mentionUser}
        expose={(api) => { feedApi = api; }}
      />

      <ChatInput
        broadcasterId={props.broadcasterId}
        broadcasterLogin={props.broadcasterLogin}
        replyTo={replyTo}
        onClearReply={clearReply}
        openUserCard={(userId) => feedApi?.showUserCard(userId)}
        expose={(api) => { inputApi = api; }}
      />
    </div>
  );
}
