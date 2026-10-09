import { Check, CornerDownRight } from "lucide-solid";
import { For } from "solid-js";
import type { Mention } from "../../lib/stores/inbox.ts";
import { knownUser } from "../../lib/stores/users.ts";
import { thirdPartyEmoteMap } from "../../lib/stores/emotes.ts";
import { cheermotesFor } from "../../lib/stores/cheermotes.ts";
import type { MentionReason } from "../../lib/utils/mention.ts";
import Avatar from "../ui/Avatar.tsx";
import Card from "../ui/Card.tsx";
import IconButton from "../ui/IconButton.tsx";
import Timestamp from "../ui/Timestamp.tsx";
import ChatterAvatar from "../feed/message/ChatterAvatar.tsx";
import MessageFragment from "../feed/message/MessageFragment.tsx";

type Props = {
  mention: Mention;
  onJump: () => void;
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
  const channelAvatar = () => knownUser(m().channelId)?.profileImageUrl;

  return (
    <Card tone={m().unread ? "accent" : "plain"}>
      <header class="flex items-center gap-2 h-14 px-3 border-b border-line-soft">
        <Avatar
          src={channelAvatar()}
          alt={m().channelName}
          size={32}
          square
        />
        <span class="text-small font-semibold text-ink truncate">
          {m().channelName}
        </span>
        <span class="text-micro text-ink-faint truncate">
          {reasonLabel(m().reason)}
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
      <div class="flex gap-3 items-start px-3 py-2.5 text-body leading-normal">
        <span class="relative w-(--chat-tile) h-(--chat-two-lines) shrink-0">
          <span class="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <ChatterAvatar
              userId={m().chatterId}
              color={m().chatterColor}
              active={false}
            />
          </span>
        </span>
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="flex items-baseline">
            <span
              class="font-semibold text-(--name) truncate"
              style={{ "--name": m().chatterColor || "var(--color-ink)" }}
            >
              {m().chatterName}
            </span>
            <Timestamp ts={m().timestamp} format="c" variant="inline" />
          </div>
          <div class="text-ink wrap-break-word line-clamp-3">
            <For each={m().fragments}>
              {(frag) => (
                <MessageFragment
                  frag={frag}
                  emotes={thirdPartyEmoteMap()}
                  cheermotes={cheermotesFor(m().channelId)}
                  mentionsYou={m().reason.kind === "mention"}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </Card>
  );
}
