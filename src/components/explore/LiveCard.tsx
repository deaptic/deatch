import { createSignal, Show } from "solid-js";
import { Clock, MessageSquare, User as UserIcon } from "lucide-solid";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Stream } from "../../lib/types/twitch/stream.ts";
import type { User } from "../../lib/types/twitch/user.ts";
import { resolveUser } from "../../lib/stores/channels.ts";
import { messageRate } from "../../lib/stores/chatActivity.ts";
import { formatUptime, formatViewers } from "../../lib/format/stream.ts";
import Avatar from "../ui/Avatar.tsx";

type Props = {
  stream: Stream;
  onSelect: (channel: User) => void;
};

const THUMBNAIL_REFRESH_MS = 5 * 60_000;
const [thumbnailVersion, setThumbnailVersion] = createSignal(0);
setInterval(() => setThumbnailVersion((v) => v + 1), THUMBNAIL_REFRESH_MS);

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
      class="group flex h-full w-full flex-col text-left"
    >
      <div class="relative aspect-video overflow-hidden rounded-xl bg-bg-light">
        <img
          src={thumbnail()}
          alt=""
          loading="lazy"
          decoding="async"
          class="absolute inset-0 size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        <div class="absolute bottom-2 right-2 flex items-center gap-1">
          <Show when={rate() > 0}>
            <span
              class="flex items-center gap-1 rounded bg-bg-dark/80 px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm"
              classList={{
                "text-danger": rate() >= 200,
                "text-warning": rate() >= 50 && rate() < 200,
                "text-text": rate() < 50,
              }}
            >
              <MessageSquare class="size-3" />
              {rate()}/min
            </span>
          </Show>
          <span class="flex items-center gap-1 rounded bg-bg-dark/80 px-1.5 py-0.5 text-[11px] font-semibold text-text backdrop-blur-sm">
            <UserIcon class="size-3" />
            {formatViewers(props.stream.viewerCount)}
          </span>
          <span class="flex items-center gap-1 rounded bg-bg-dark/80 px-1.5 py-0.5 text-[11px] font-medium text-text backdrop-blur-sm">
            <Clock class="size-3" />
            {formatUptime(props.stream.startedAt)}
          </span>
        </div>
      </div>

      <div class="mt-3 flex gap-3">
        <Avatar
          src={channel().profileImageUrl}
          alt={channel().displayName}
          class="size-9 shrink-0 rounded-lg"
        />
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-semibold leading-snug text-text">
            {props.stream.title}
          </p>
          <p class="mt-1 truncate text-xs text-text-muted">
            {channel().displayName}
          </p>
          <Show when={props.stream.game.name}>
            <p class="mt-1 truncate text-xs font-medium text-primary">
              {props.stream.game.name}
            </p>
          </Show>
        </div>
      </div>
    </button>
  );
}
