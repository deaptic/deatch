import { Check, CornerDownRight } from "lucide-solid";
import type { Mention } from "../../lib/types/index.ts";
import { knownUser, user } from "../../lib/stores/users.ts";
import { thirdPartyEmoteMap } from "../../lib/stores/emotes.ts";
import { cheermotesFor } from "../../lib/stores/cheermotes.ts";
import { feeds } from "../../lib/stores/feeds.ts";
import {
  feedDensity,
  feedKeywords,
  feedShowTimestamp,
} from "../../lib/stores/preferences.ts";
import type { MentionReason } from "../../lib/utils/mention.ts";
import Avatar from "../ui/Avatar.tsx";
import Card from "../ui/Card.tsx";
import IconButton from "../ui/IconButton.tsx";
import FeedItem from "../feed/FeedItem.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";

type Props = {
  mention: Mention;
  onJump: () => void;
  onOpenChannel: () => void;
  onClear: () => void;
};

function reasonLabel(reason: MentionReason): string {
  switch (reason.kind) {
    case "mention":
      return "mentioned you";
    case "reply":
      return "replied to you";
    case "keyword":
      return `matched ${reason.term}`;
  }
}

export default function InboxItem(props: Props) {
  const m = () => props.mention;
  const channel = () => knownUser(m().channelId);
  const link = createChannelLink(channel, props.onOpenChannel);

  return (
    <Card tone={m().unread ? "accent" : "plain"}>
      <header class="flex items-center gap-2 p-2 border-b border-line-soft text-(length:--chat-size)">
        {/* Shrunk like the feed-meta text beside it (0.85em). */}
        <span
          class={`shrink-0 size-(--tile) ${link.cursor}`}
          style={{ "--tile": "calc(var(--chat-tile) * 0.85)" }}
          {...link.handlers}
        >
          <Avatar
            src={channel()?.profileImageUrl}
            alt={m().channelName}
            size="fill"
            square
          />
        </span>
        <span class="feed-meta min-w-0 flex flex-col leading-tight">
          <span
            class={`font-semibold text-ink truncate hover:underline ${link.cursor}`}
            {...link.handlers}
          >
            {m().channelName}
          </span>
          <span class="feed-meta text-ink-faint truncate">
            {m().message.chatter_name} {reasonLabel(m().reason)}
          </span>
        </span>
        <span class="ml-auto flex items-center gap-1">
          <IconButton
            size="sm"
            variant="neutral"
            label="Jump to message"
            onClick={props.onJump}
          >
            <CornerDownRight class="size-4" />
          </IconButton>
          <IconButton
            size="sm"
            variant="neutral"
            label="Clear"
            onClick={props.onClear}
          >
            <Check class="size-4" />
          </IconButton>
        </span>
      </header>
      <div class="p-2 text-(length:--chat-size)">
        <FeedItem
          entry={m().message}
          density={feedDensity()}
          bare
          showTimestamp={feedShowTimestamp()}
          emotes={thirdPartyEmoteMap()}
          cheermotes={cheermotesFor(m().channelId)}
          badges={feeds[m().channelId]?.badges ?? {}}
          userLogin={user()?.login ?? ""}
          reactions={[]}
          keywords={feedKeywords()}
          showToolbar={false}
          highlightMentions={false}
        />
      </div>
      {link.menu()}
    </Card>
  );
}
