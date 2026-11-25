import { X } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Badge from "../../kit/Badge.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Timestamp from "../../kit/Timestamp.tsx";
import { ChatterPicture } from "../message/index.ts";
import type { Conversation } from "./model.ts";
import ListRow from "../../kit/ListRow.tsx";

type Props = {
  conversation: Conversation;
  selected: boolean;
  onSelect: () => void;
  onDiscard: () => void;
};

export default function ConversationRow(props: Props) {
  const c = () => props.conversation;
  const preview = () => {
    const last = c().last;
    if (!last) return t("WHISPERS_NEW_CONVERSATION_VALUE");
    return last.outgoing
      ? t("WHISPERS_YOU_SAID_VALUE", { text: last.text })
      : last.text;
  };
  return (
    <ListRow
      selected={props.selected}
      revealActions
      actions={
        !c().last && (
          <IconButton
            label={t("WHISPERS_DISCARD_LABEL")}
            size="sm"
            onClick={() => props.onDiscard()}
          >
            <X class="size-4" />
          </IconButton>
        )
      }
      onClick={() => props.onSelect()}
    >
      <ChatterPicture
        size={32}
        userId={c().peer.id}
        name={c().peer.displayName}
      />
      <span class="flex-1 min-w-0 flex flex-col">
        <span class="flex items-center gap-2 min-w-0">
          <span class="flex-1 min-w-0 truncate text-body font-semibold text-ink">
            {c().peer.displayName}
          </span>
          <Show when={c().last}>
            {(last) => (
              <span class="shrink-0 text-small text-ink-faint">
                <Timestamp ts={last().timestamp} />
              </span>
            )}
          </Show>
        </span>
        <span class="flex items-center gap-2 min-w-0">
          <span class="flex-1 min-w-0 truncate text-small text-ink-soft">
            {preview()}
          </span>
          <Show when={c().unread}>
            <Badge count={c().unread} />
          </Show>
        </span>
      </span>
    </ListRow>
  );
}
