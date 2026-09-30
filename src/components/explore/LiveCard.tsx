import { createSignal, Show } from "solid-js";
import { MessageSquare } from "lucide-solid";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Stream } from "../../lib/types/index.ts";
import type { User } from "../../lib/types/index.ts";
import { resolveUser } from "../../lib/stores/channels.ts";
import { messageRate } from "../../lib/stores/chatActivity.ts";
import { formatUptime } from "../../lib/format/stream.ts";
import Avatar from "../ui/Avatar.tsx";
import LivePill from "../ui/LivePill.tsx";

type Props = {
  stream: Stream;
  onSelect: (channel: User) => void;
};

const THUMBNAIL_REFRESH_MS = 5 * 60_000;
const [thumbnailVersion, setThumbnailVersion] = createSignal(0);
setInterval(() => setThumbnailVersion((v) => v + 1), THUMBNAIL_REFRESH_MS);

const OVERLAY_CHIP =
  "flex items-center gap-1 rounded-xs bg-black/55 px-1.5 py-0.5 text-micro text-white tabular-nums";

export default function LiveCard(props: Props) {
  const channel = () => resolveUser(props.stream.user);
  const rate = () => messageRate(props.stream.user.id);
  const thumbnail = () =>
    `${props.stream.thumbnail.medium}?v=${thumbnailVersion()}`;

  return (
    <button
      type="button"
      onClick={() => props.onSelect(channel())}
      onAuxClick={(e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        openUrl(`https://twitch.tv/${channel().login}`);
      }}
      onMouseDown={(e) => {
        if (e.button === 1) e.preventDefault();
      }}
      title="Open chat · middle-click for browser"
      class="group flex flex-col text-left bg-surface rounded-lg overflow-hidden border border-transparent [[data-theme=light]_&]:border-line-soft transition-colors duration-snap hover:bg-raised cursor-pointer"
    >
      <div class="relative aspect-video overflow-hidden bg-raised">
        <img
          src={thumbnail()}
          alt=""
          loading="lazy"
          decoding="async"
          class="absolute inset-0 size-full object-cover"
        />
        <span class="absolute left-2.5 top-2.5">
          <LivePill viewers={props.stream.viewerCount} solid />
        </span>
        <div class="absolute bottom-2.5 right-2.5 flex items-center gap-1">
          <Show when={rate() > 0}>
            <span class={OVERLAY_CHIP}>
              <MessageSquare class="size-3" />
              {rate()}/min
            </span>
          </Show>
          <span class={OVERLAY_CHIP}>
            {formatUptime(props.stream.startedAt)}
          </span>
        </div>
      </div>

      <div class="flex gap-3 px-3.5 pt-3 pb-3.5 items-start">
        <Avatar
          src={channel().profileImageUrl}
          alt={channel().displayName}
          size={36}
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-body font-semibold text-ink">
            {channel().displayName}
          </p>
          <Show when={props.stream.game.name}>
            <p class="truncate text-small text-ink-soft">
              {props.stream.game.name}
            </p>
          </Show>
          <p class="mt-0.5 truncate text-small text-ink-faint">
            {props.stream.title}
          </p>
        </div>
      </div>
    </button>
  );
}
