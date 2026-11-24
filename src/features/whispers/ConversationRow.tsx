import { X } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Badge from "../../kit/Badge.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Timestamp from "../../kit/Timestamp.tsx";
import { ChatterPicture } from "../message/index.ts";
import type { Conversation } from "./model.ts";

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
    <div
      class="group flex items-center gap-1 pr-1.5 rounded-sm hover:bg-raised"
      classList={{ "bg-raised": props.selected }}
    >
      <button
        type="button"
        aria-current={props.selected}
        class="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
        onClick={() => props.onSelect()}
      >
        <span class="size-8 shrink-0 grid place-items-center rounded-full overflow-hidden bg-raised text-small">
          <ChatterPicture userId={c().peer.id} name={c().peer.displayName} />
        </span>
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
      </button>
      <Show when={!c().last}>
        <span class="invisible group-hover:visible group-focus-within:visible">
          <IconButton
            label={t("WHISPERS_DISCARD_LABEL")}
            size="sm"
            onClick={() => props.onDiscard()}
          >
            <X class="size-4" />
          </IconButton>
        </span>
      </Show>
    </div>
  );
}
