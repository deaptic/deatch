import { Check, CornerDownRight } from "lucide-solid";
import type { Mention, MentionReason } from "./types.ts";
import { knownUser, user } from "../users/index.ts";
import { createResource } from "solid-js";
import { cheermotes, emoteMapFor } from "../emotes/index.ts";
import { feeds, Message } from "../feed/index.ts";
import {
  feedDensity,
  highlightWords,
  feedShowTimestamp,
} from "../preferences/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import Card from "../../kit/Card.tsx";
import IconButton from "../../kit/IconButton.tsx";
import { createChannelLink } from "../menus/index.ts";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  mention: Mention;
  onJump: () => void;
  onOpenChannel: () => void;
  onClear: () => void;
};

function reasonLabel(name: string, reason: MentionReason): string {
  return t("INBOX_REASON_LABEL", {
    name,
    reason: reason.kind,
    term: reason.kind === "keyword" ? reason.term : undefined,
  });
}

export default function Item(props: Props) {
  const m = () => props.mention;
  const channel = () => knownUser(m().broadcasterId);
  const link = createChannelLink(channel, props.onOpenChannel);
  const [emotes] = createResource(
    () => ({ id: m().broadcasterId, login: m().broadcasterLogin }),
    emoteMapFor,
  );

  return (
    <Card tone={m().unread ? "marked" : "plain"}>
      <header class="flex items-center gap-2 p-2 text-(length:--chat-size)">
        <span
          class={`shrink-0 size-feed-meta-tile ${link.cursor}`}
          {...link.handlers}
        >
          <Avatar
            src={channel()?.profileImageUrl}
            alt={m().broadcasterName}
            size="fill"
            square
          />
        </span>
        <span class="text-feed-meta min-w-0 flex flex-col leading-tight">
          <span
            class={`font-semibold text-ink truncate hover:underline ${link.cursor}`}
            {...link.handlers}
          >
            {m().broadcasterName}
          </span>
          <span class="text-feed-meta text-ink-faint truncate">
            {reasonLabel(m().message.chatter_name, m().reason)}
          </span>
        </span>
        <span class="ml-auto flex items-center gap-1">
          <IconButton
            size="sm"
            variant="neutral"
            label={t("INBOX_JUMP_LABEL")}
            onClick={props.onJump}
          >
            <CornerDownRight class="size-4" />
          </IconButton>
          <IconButton
            size="sm"
            variant="neutral"
            label={t("INBOX_CLEAR_LABEL")}
            onClick={props.onClear}
          >
            <Check class="size-4" />
          </IconButton>
        </span>
      </header>
      <div class="p-2 text-(length:--chat-size)">
        <Message
          item={m().message}
          density={feedDensity()}
          bare
          showTimestamp={feedShowTimestamp()}
          emotes={emotes() ?? {}}
          cheermotes={cheermotes.forChannel(m().broadcasterId)}
          badges={feeds[m().broadcasterId]?.badges ?? {}}
          userLogin={user()?.login ?? ""}
          reactions={[]}
          keywords={highlightWords()}
          showToolbar={false}
          highlightMentions={false}
        />
      </div>
      {link.menu()}
    </Card>
  );
}
