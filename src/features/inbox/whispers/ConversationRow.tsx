import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import SideRow from "../../../kit/SideRow.tsx";
import Text from "../../../kit/Text.tsx";
import Timestamp from "../../../kit/Timestamp.tsx";
import { ChatterPicture } from "../../message/index.ts";
import type { Conversation } from "./model.ts";

type Props = {
  conversation: Conversation;
  expanded: boolean;
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
    <SideRow
      expanded={props.expanded}
      label={c().peer.displayName}
      sub={preview()}
      selected={props.selected}
      unread={c().unread > 0}
      count={c().unread}
      trailing={
        <Show when={c().last}>
          {(last) => (
            <Text size="sm" tone="faint" class="shrink-0">
              <Timestamp ts={last().timestamp} />
            </Text>
          )}
        </Show>
      }
      onClick={() => props.onSelect()}
      onMiddleClick={c().last ? undefined : () => props.onDiscard()}
    >
      <ChatterPicture
        size="md"
        userId={c().peer.id}
        name={c().peer.displayName}
      />
    </SideRow>
  );
}
