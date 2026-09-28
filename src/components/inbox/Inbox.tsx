import { AtSign } from "lucide-solid";
import { createMemo, For, Show } from "solid-js";
import InboxItem from "./InboxItem.tsx";
import {
  markAllMentionsRead,
  type Mention,
  mentions,
} from "../../lib/stores/inbox.ts";
import Avatar from "../ui/Avatar.tsx";
import Badge from "../ui/Badge.tsx";
import Button from "../ui/Button.tsx";
import EmptyState from "../ui/EmptyState.tsx";
import Popover from "../ui/Popover.tsx";
import { resolveUser } from "../../lib/stores/channels.ts";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  onJump: (channelId: string, messageId: string) => void;
};

type Group = { channelId: string; name: string; items: Mention[] };

function groupByChannel(list: Mention[]): Group[] {
  const groups = new Map<string, Group>();
  for (const m of list) {
    let g = groups.get(m.channelId);
    if (!g) {
      g = { channelId: m.channelId, name: m.channelName, items: [] };
      groups.set(m.channelId, g);
    }
    g.items.push(m);
  }
  return [...groups.values()];
}

export default function Inbox(props: Props) {
  const groups = createMemo(() => groupByChannel(mentions()));
  const unreadIn = (items: Mention[]) => items.filter((m) => m.unread).length;

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
          when={groups().length > 0}
          fallback={
            <EmptyState
              icon={<AtSign />}
              title="Nothing here yet"
              body="Mentions and keyword hits from every channel land here."
            />
          }
        >
          <div class="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
            <For each={groups()}>
              {(g) => {
                const channel = () =>
                  resolveUser({
                    id: g.channelId,
                    login: g.items[0].channelLogin,
                    displayName: g.name,
                  });
                return (
                  <section class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-2.5 pt-3 pb-1.5 px-2">
                      <Avatar
                        src={channel().profileImageUrl}
                        alt={g.name}
                        size={24}
                      />
                      <span class="text-body font-semibold text-ink flex-1 truncate">
                        {g.name}
                      </span>
                      <Show when={unreadIn(g.items) > 0}>
                        <Badge count={unreadIn(g.items)} />
                      </Show>
                    </div>
                    <For each={g.items}>
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
                  </section>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </Popover>
  );
}
