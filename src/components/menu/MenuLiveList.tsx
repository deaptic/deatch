import { Show, For } from "solid-js";
import Navigation from "../ui/Navigation.tsx";
import MenuSectionItem from "./MenuSectionItem.tsx";
import { watchMode } from "../../lib/stores/watch.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import { channelMentionCount } from "../../lib/stores/inbox.ts";
import type { User } from "../../lib/types/twitch/user.ts";

type Props = {
  channels: User[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (ch: User) => void;
  onOpenInBrowser: (ch: User) => void;
  onContextMenu: (ch: User, x: number, y: number) => void;
}

export default function MenuLiveList(props: Props) {
  return (
    <Navigation
      orientation="vertical"
      scroll={false}
      indicatorClass="bg-primary rounded-r-full"
    >
      <Show
        when={!props.loading}
        fallback={
          <>
            {Array.from({ length: 4 }).map(() => (
              <div class="w-full flex items-center justify-center p-2">
                <div class="w-8 h-8 rounded-lg bg-bg-light animate-pulse" />
              </div>
            ))}
          </>
        }
      >
        <For each={props.channels}>
          {(ch) => (
            <div data-channel-id={ch?.id}>
              <MenuSectionItem
                channel={ch}
                status="live"
                selected={watchMode() === null && props.selectedId === ch?.id}
                unread={hasUnread(ch?.id)}
                mentions={channelMentionCount(ch?.id)}
                onClick={() => props.onSelect(ch)}
                onMiddleClick={() => props.onOpenInBrowser(ch)}
                onContextMenu={(x, y) => props.onContextMenu(ch, x, y)}
              />
            </div>
          )}
        </For>
      </Show>
    </Navigation>
  );
}
