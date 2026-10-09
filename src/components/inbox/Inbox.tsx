import { AtSign } from "lucide-solid";
import { createEffect, Show } from "solid-js";
import InboxGroup from "./InboxGroup.tsx";
import {
  dismissAllMentions,
  dismissMention,
  type Mention,
  mentions,
} from "../../lib/stores/inbox.ts";
import * as users from "../../lib/services/users.ts";
import Button from "../ui/Button.tsx";
import EmptyState from "../ui/EmptyState.tsx";
import Popover from "../ui/Popover.tsx";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  onJump: (channelId: string, messageId: string) => void;
};

export default function Inbox(props: Props) {
  createEffect(() => {
    const ids = [
      ...new Set(mentions().flatMap((m) => [m.chatterId, m.channelId])),
    ];
    if (ids.length) users.get(ids).catch(() => {});
  });

  const unread = () => mentions().filter((m) => m.unread);
  const seen = () => mentions().filter((m) => !m.unread);

  function jump(m: Mention) {
    props.onJump(m.channelId, m.messageId);
    props.onClose();
  }

  const clear = (m: Mention) => dismissMention(m.id);

  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div class="w-120 max-w-full max-h-160 flex flex-col">
        <header class="h-header shrink-0 flex items-center gap-2 pl-5 pr-3 border-b border-line-soft">
          <h2 class="text-title text-ink flex-1">Inbox</h2>
          <Show when={mentions().length > 0}>
            <Button variant="ghost" size="sm" onClick={dismissAllMentions}>
              Clear all
            </Button>
          </Show>
        </header>
        <Show
          when={mentions().length > 0}
          fallback={
            <EmptyState
              icon={<AtSign />}
              title="Nothing here yet"
              body="Mentions and keyword hits from every channel land here."
            />
          }
        >
          <div class="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-4">
            <InboxGroup
              label="New"
              mentions={unread()}
              onJump={jump}
              onClear={clear}
            />
            <InboxGroup
              label="Earlier"
              mentions={seen()}
              onJump={jump}
              onClear={clear}
            />
          </div>
        </Show>
      </div>
    </Popover>
  );
}
