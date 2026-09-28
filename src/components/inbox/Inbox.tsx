import { AtSign } from "lucide-solid";
import { For, Show } from "solid-js";
import InboxItem from "./InboxItem.tsx";
import { markAllMentionsRead, mentions } from "../../lib/stores/inbox.ts";
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
  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div class="w-120 max-w-full max-h-160 flex flex-col">
        <header class="h-header shrink-0 flex items-center gap-2 pl-5 pr-3 border-b border-line-soft">
          <h2 class="text-title text-ink flex-1">Inbox</h2>
          <Show
            when={mentions().some((m) =>
              m.unread
            )}
          >
            <Button variant="ghost" size="sm" onClick={markAllMentionsRead}>
              Mark all read
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
          <div class="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-0.5">
            <For each={mentions()}>
              {(m) => (
                <InboxItem
                  mention={m}
                  onClick={() => {
                    props.onJump(m.channelId, m.messageId);
                    props.onClose();
                  }}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Popover>
  );
}
