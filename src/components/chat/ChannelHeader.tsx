import { Ellipsis, ExternalLink } from "lucide-solid";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { streamForUserId } from "../../lib/stores/channels.ts";
import {
  advancedDeveloperMode,
  pinChannel,
  pinnedChannels,
  unpinChannel,
} from "../../lib/stores/preferences.ts";
import { POPOVER_TOGGLE } from "../../lib/primitives/dismissOnOutside.ts";
import { beginRaid } from "../../lib/stores/raid.ts";
import { user } from "../../lib/stores/users.ts";
import { formatUptime } from "../../lib/format/stream.ts";
import type { User } from "../../lib/types/twitch/user.ts";
import Avatar from "../ui/Avatar.tsx";
import IconButton from "../ui/IconButton.tsx";
import LivePill from "../ui/LivePill.tsx";
import ChannelContextMenu from "../context-menus/ChannelContextMenu.tsx";

type Props = {
  channel: User;
};

export default function ChannelHeader(props: Props) {
  const stream = () => streamForUserId(props.channel.id);
  const [tick, setTick] = createSignal(0);
  const [menu, setMenu] = createSignal<{ x: number; y: number } | null>(null);

  onMount(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    onCleanup(() => clearInterval(id));
  });

  const uptime = () => {
    tick();
    const s = stream();
    return s ? formatUptime(s.startedAt) : "";
  };

  const openInBrowser = (ch: User) => openUrl(`https://twitch.tv/${ch.login}`);

  return (
    <header class="h-header shrink-0 flex items-center gap-3 pl-5 pr-3 border-b border-line-soft">
      <Avatar
        src={props.channel.profileImageUrl}
        alt={props.channel.displayName}
        size={32}
      />
      <div class="flex items-center gap-2.5 min-w-0">
        <h1 class="text-title text-ink whitespace-nowrap">
          {props.channel.displayName}
        </h1>
        <Show when={stream()}>
          {(s) => (
            <>
              <LivePill viewers={s().viewerCount} />
              <span class="text-small text-ink-soft truncate">
                {s().game.name}
                <Show when={uptime()}>{` · ${uptime()}`}</Show>
              </span>
            </>
          )}
        </Show>
      </div>
      <div class="flex-1" />
      <IconButton
        label="Open in browser"
        onClick={() => openInBrowser(props.channel)}
      >
        <ExternalLink class="size-4" />
      </IconButton>
      <IconButton
        label="More"
        pressed={menu() !== null}
        {...{ [POPOVER_TOGGLE]: "" }}
        onClick={(e) => {
          if (menu()) {
            setMenu(null);
            return;
          }
          const r = e.currentTarget.getBoundingClientRect();
          setMenu({ x: r.right, y: r.bottom + 4 });
        }}
      >
        <Ellipsis class="size-4" />
      </IconButton>
      <Show when={menu()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            align="end"
            ch={props.channel}
            isPinned={pinnedChannels().includes(props.channel.id)}
            developerMode={advancedDeveloperMode()}
            onClose={() => setMenu(null)}
            onOpenInBrowser={openInBrowser}
            onPin={(ch) => pinChannel(ch.id)}
            onUnpin={unpinChannel}
            onRaid={user() && props.channel.id !== user()?.id
              ? (ch) => {
                const self = user();
                if (self) beginRaid(self.id, ch).catch(() => {});
              }
              : undefined}
          />
        )}
      </Show>
    </header>
  );
}
