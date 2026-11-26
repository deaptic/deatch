import { Check, CornerDownRight } from "lucide-solid";
import { createResource } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import { avatarZoom } from "../../../shared/avatar.ts";
import { emoteMapFor } from "../../emotes/index.ts";
import { createChannelLink } from "../../menus/index.ts";
import { knownUser } from "../../users/index.ts";
import Avatar from "../../../kit/Avatar.tsx";
import IconButton from "../../../kit/IconButton.tsx";
import Card from "../../../kit/Card.tsx";
import Text from "../../../kit/Text.tsx";
import * as mentions from "./store.ts";
import MentionRow from "./MentionRow.tsx";
import type { Mention } from "./types.ts";

type Props = {
  mention: Mention;
  selected: boolean;
  onJump: (messageId: string) => void;
  onOpenChannel: () => void;
};

export default function MentionCard(props: Props) {
  const m = () => props.mention;
  const channel = () => knownUser(m().broadcasterId);
  const link = createChannelLink(channel, () => props.onOpenChannel());
  const reason = () => {
    const why = m().reason;
    return t("INBOX_REASON_LABEL", {
      reason: why.kind,
      term: why.kind === "keyword" ? why.term : undefined,
    });
  };
  const [emotes] = createResource(
    () => ({ id: m().broadcasterId, login: m().broadcasterLogin }),
    emoteMapFor,
  );

  return (
    <Card tone={m().unread ? "tinted" : "plain"} selected={props.selected}>
      <header
        data-mention-id={m().id}
        class="flex items-center gap-2 px-4 pt-3 pb-1 text-(length:--chat-size)"
      >
        <span class="flex-1 min-w-0 flex items-center gap-1.5">
          <Text
            size="relative"
            bold
            tone="soft"
            interactive
            class="shrink-0 max-w-1/2 flex items-center"
            {...link.handlers}
          >
            <span class="h-lh aspect-square shrink-0 mr-2">
              <Avatar
                src={channel()?.profileImageUrl}
                zoom={avatarZoom(channel()?.profileImageUrl)}
                alt={m().broadcasterName}
                size="fill"
                square
              />
            </span>
            <span class="truncate">{m().broadcasterName}</span>
          </Text>
          <Text size="relative" tone="faint" truncate class="min-w-0">
            · {reason()}
          </Text>
        </span>
        <span class="shrink-0 flex gap-1">
          <IconButton
            label={t("INBOX_JUMP_LABEL")}
            size="sm"
            variant="neutral"
            onClick={() => props.onJump(m().message.message_id)}
          >
            <CornerDownRight class="size-4" />
          </IconButton>
          <IconButton
            label={t("INBOX_MARK_READ_LABEL")}
            size="sm"
            variant="neutral"
            onClick={() => mentions.dismiss(m().id)}
          >
            <Check class="size-4" />
          </IconButton>
        </span>
      </header>
      <div class="px-4 pt-1 pb-3">
        <MentionRow
          mention={m()}
          emotes={emotes() ?? {}}
          onJump={props.onJump}
        />
      </div>
      {link.menu()}
    </Card>
  );
}
