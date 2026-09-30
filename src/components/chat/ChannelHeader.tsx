import { Clock, Gamepad2, Moon, Users } from "lucide-solid";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { channelInfoFor, streamForUserId } from "../../lib/stores/channels.ts";
import {
  advancedDeveloperMode,
  pinChannel,
  pinnedChannels,
  unpinChannel,
} from "../../lib/stores/preferences.ts";
import { beginRaid } from "../../lib/stores/raid.ts";
import { user } from "../../lib/stores/users.ts";
import { formatUptime, formatViewers } from "../../lib/format/stream.ts";
import { createCopied } from "../../lib/primitives/createCopied.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import Stat from "../ui/Stat.tsx";
import ChannelContextMenu from "../context-menus/ChannelContextMenu.tsx";

type Props = {
  channel: User;
};

export default function ChannelHeader(props: Props) {
  const stream = () => streamForUserId(props.channel.id);
  const info = () => channelInfoFor(props.channel.id);
  const title = () => stream()?.title ?? info()?.title ?? "";
  const game = () => stream()?.game.name ?? info()?.game.name ?? "";
  const [tick, setTick] = createSignal(0);
  const [menu, setMenu] = createSignal<{ x: number; y: number } | null>(null);
  const name = createCopied();
  const titleCopy = createCopied();

  onMount(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1_000);
    onCleanup(() => clearInterval(id));
  });

  const uptime = () => {
    tick();
    const s = stream();
    return s ? formatUptime(s.startedAt) : "";
  };

  const openInBrowser = (ch: User) => openUrl(`https://twitch.tv/${ch.login}`);

  return (
    <header
      class="h-28 shrink-0 flex items-center gap-4 pl-4 pr-6 border-b border-line-soft"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <button
        type="button"
        title="Open channel on Twitch"
        class="shrink-0 flex rounded-sm cursor-pointer"
        onClick={() => openInBrowser(props.channel)}
        onAuxClick={(e) => {
          if (e.button !== 1) return;
          e.preventDefault();
          openInBrowser(props.channel);
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Avatar
          src={props.channel.profileImageUrl}
          alt={props.channel.displayName}
          size={80}
          square
          presence={stream() ? "live" : "offline"}
        />
      </button>
      <div class="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <h1
          class={`text-title truncate cursor-pointer transition-colors duration-snap ${
            name.copied() ? "text-positive" : "text-ink hover:text-accent-ink"
          }`}
          title="Click to copy"
          onClick={() => name.copy(props.channel.displayName)}
        >
          {props.channel.displayName}
        </h1>
        <Show when={title()}>
          {(t) => (
            <p
              class={`text-body truncate cursor-pointer transition-colors duration-snap ${
                titleCopy.copied()
                  ? "text-positive"
                  : "text-ink-soft hover:text-ink"
              }`}
              title={t()}
              onClick={() => titleCopy.copy(t())}
            >
              {t()}
            </p>
          )}
        </Show>
        <div class="flex items-center gap-5 min-w-0 text-small">
          <Stat icon={<Gamepad2 />} value={game()} copy={game()} truncate />
          <Show
            when={stream()}
            fallback={<Stat icon={<Moon />} value="Offline" />}
          >
            {(s) => (
              <>
                <Stat
                  icon={<Users />}
                  value={formatViewers(s().viewerCount)}
                  copy={String(s().viewerCount)}
                />
                <Stat icon={<Clock />} value={uptime()} copy={uptime()} />
              </>
            )}
          </Show>
        </div>
      </div>
      <Show when={menu()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={props.channel}
            isPinned={pinnedChannels().includes(props.channel.id)}
            developerMode={advancedDeveloperMode()}
            onClose={() => setMenu(null)}
            onOpenInBrowser={openInBrowser}
            onPin={props.channel.id === user()?.id
              ? undefined
              : (ch) => pinChannel(ch.id)}
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
