import {
  createSignal,
  createMemo,
  createEffect,
  For,
  Show,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getUsers, type User } from "../../commands/users";
import {
  getChannelFollowers,
  type GetChannelFollowersResponse,
} from "../../commands/channels";
import { user as currentUser, moderatedChannels } from "../../state/users";
import { feeds } from "../feed/feeds";
import type { FeedMessage } from "../feed/types";
import { addToast } from "../../state/toasts";
import CloseIcon from "../../icons/CloseIcon";
import CalendarIcon from "../../icons/CalendarIcon";
import HashIcon from "../../icons/HashIcon";
import ExternalLinkIcon from "../../icons/ExternalLinkIcon";
import HeartIcon from "../../icons/HeartIcon";

type Follower = GetChannelFollowersResponse["data"][number];

function copyField(text: string) {
  navigator.clipboard.writeText(text).then(
    () => addToast("Copied", "success"),
    () => addToast("Copy failed", "error"),
  );
}

type Props = {
  x: number;
  y: number;
  chatterId: string;
  broadcasterId: string;
  getBounds: () => DOMRect | null;
  onClose: () => void;
};

const CARD_W = 384;
const CARD_MAX_H = 480;
const PAD = 8;

export default function UserCard(props: Props) {
  const [user, setUser] = createSignal<User | null>(null);
  let cardRef: HTMLDivElement | undefined;

  function clamp(x: number, y: number, w: number, h: number) {
    const b = props.getBounds();
    const left = b?.left ?? 0;
    const top = b?.top ?? 0;
    const right = b?.right ?? window.innerWidth;
    const bottom = b?.bottom ?? window.innerHeight;
    return {
      x: Math.max(left + PAD, Math.min(x, right - w - PAD)),
      y: Math.max(top + PAD, Math.min(y, bottom - h - PAD)),
    };
  }

  const [pos, setPos] = createSignal(clamp(props.x, props.y, CARD_W, CARD_MAX_H));

  const [follower, setFollower] = createSignal<Follower | null>(null);

  const canQueryFollowers = () => {
    const me = currentUser();
    if (!me) return false;
    if (me.id === props.broadcasterId) return true;
    return moderatedChannels().some(
      (c) => c.broadcaster_id === props.broadcasterId,
    );
  };

  createEffect(() => {
    const id = props.chatterId;
    setUser(null);
    setFollower(null);
    getUsers({ userIds: [id] })
      .then((users) => setUser(users[0] ?? null))
      .catch(() => {});
    if (!canQueryFollowers()) return;
    getChannelFollowers(
      { broadcasterId: props.broadcasterId, userId: id, first: 1 },
      { silent: true },
    )
      .then((res) => setFollower(res.data[0] ?? null))
      .catch(() => {});
  });

  onMount(() => {
    if (!cardRef) return;
    const rect = cardRef.getBoundingClientRect();
    setPos((p) => clamp(p.x, p.y, rect.width, rect.height));
  });

  function startDrag(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    const start = pos();
    const offsetX = e.clientX - start.x;
    const offsetY = e.clientY - start.y;
    const onMove = (ev: MouseEvent) => {
      const w = cardRef?.offsetWidth ?? CARD_W;
      const h = cardRef?.offsetHeight ?? CARD_MAX_H;
      setPos(clamp(ev.clientX - offsetX, ev.clientY - offsetY, w, h));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const messages = createMemo<FeedMessage[]>(() => {
    const feed = feeds[props.broadcasterId];
    if (!feed) return [];
    return feed.messages.filter(
      (m): m is FeedMessage =>
        m.kind === "message" && m.chatter_user_id === props.chatterId,
    );
  });

  const formatJoinDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const nameColor = createMemo(() => {
    const c = messages().find((m) => m.color)?.color;
    return c ? `oklch(from ${c} max(l, 0.65) c h)` : undefined;
  });

  function visibleText(m: FeedMessage): string {
    if (!m.reply) return m.fragments.map((f) => f.text).join("");
    const [first, ...rest] = m.fragments;
    if (
      first?.type === "mention" &&
      first.user_login === m.reply.parent_user_login
    ) {
      if (rest[0]?.type === "text") {
        const trimmed = rest[0].text.trimStart();
        const remaining = trimmed
          ? [{ ...rest[0], text: trimmed }, ...rest.slice(1)]
          : rest.slice(1);
        return remaining.map((f) => f.text).join("");
      }
      return rest.map((f) => f.text).join("");
    }
    return m.fragments.map((f) => f.text).join("");
  }

  return (
    <Portal>
      <div
        ref={cardRef}
        class="fixed z-50 bg-bg border border-border-muted rounded-lg shadow-2xl overflow-hidden flex flex-col w-96 h-80 min-w-72 min-h-64 resize"
        style={{
          top: `${pos().y}px`,
          left: `${pos().x}px`,
          "max-width": `calc(100vw - ${pos().x}px - ${PAD}px)`,
          "max-height": `calc(100vh - ${pos().y}px - ${PAD}px)`,
        }}
      >
        <div
          class="flex gap-3 p-3 border-b border-border-muted cursor-move select-none"
          onMouseDown={startDrag}
        >
          <img
            src={user()?.profile_image_url || ""}
            alt={user()?.display_name ?? ""}
            title="Click to copy image URL"
            class="w-22 h-22 shrink-0 self-start rounded-lg bg-bg-light cursor-pointer object-cover"
            onClick={() =>
              user()?.profile_image_url && copyField(user()!.profile_image_url!)
            }
          />
          <div class="flex-1 min-w-0 flex flex-col gap-1">
            <div class="flex items-center gap-1 min-w-0">
              <span
                class="font-semibold text-text text-lg leading-tight truncate flex-1"
                style={nameColor() ? { color: nameColor() } : undefined}
              >
                {user()?.display_name ?? props.chatterId}
              </span>
              <button
                class="shrink-0 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-light rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() =>
                  user() && openUrl(`https://twitch.tv/${user()!.login}`)
                }
                disabled={!user()}
                title="Open channel on Twitch"
                aria-label="Open channel on Twitch"
              >
                <ExternalLinkIcon class="w-2.5 h-2.5" />
              </button>
              <button
                class="shrink-0 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-light rounded transition-colors cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={props.onClose}
                title="Close"
                aria-label="Close"
              >
                <CloseIcon class="w-2.5 h-2.5" />
              </button>
            </div>
            <div class="flex items-baseline gap-1.5 min-w-0 flex-wrap">
              <Show when={user()}>
                <span
                  class="text-text-muted/70 text-sm truncate cursor-pointer hover:text-text-muted"
                  title="Click to copy"
                  onClick={() => copyField(user()!.login)}
                >
                  @{user()!.login}
                </span>
                <span class="text-text-muted/40 text-sm">·</span>
              </Show>
              <span
                class="text-text-muted/70 text-xs inline-flex items-center gap-1 cursor-pointer hover:text-text-muted tabular-nums shrink-0"
                title="Click to copy ID"
                onClick={() => copyField(props.chatterId)}
              >
                <HashIcon class="w-3 h-3 shrink-0" />
                {props.chatterId}
              </span>
            </div>
            <div class="text-text-muted text-xs mt-1.5 truncate flex items-center gap-1.5">
              <Show when={user()?.created_at}>
                <span
                  class="inline-flex items-center gap-1.5 cursor-pointer hover:text-text"
                  title="Click to copy"
                  onClick={() => copyField(formatJoinDate(user()!.created_at))}
                >
                  <CalendarIcon class="w-3 h-3 shrink-0" />
                  <span>{formatJoinDate(user()!.created_at)}</span>
                </span>
                <span class="opacity-50">·</span>
              </Show>
              <Show
                when={follower()}
                fallback={
                  <span
                    class="inline-flex items-center gap-1.5 opacity-60"
                    title="Mod permission required to view follow status"
                  >
                    <HeartIcon class="w-3 h-3 shrink-0" />
                    <span>Unknown</span>
                  </span>
                }
              >
                <span
                  class="inline-flex items-center gap-1.5 cursor-pointer hover:text-text"
                  title="Click to copy"
                  onClick={() =>
                    copyField(formatJoinDate(follower()!.followed_at))
                  }
                >
                  <HeartIcon class="w-3 h-3 shrink-0" />
                  <span>{formatJoinDate(follower()!.followed_at)}</span>
                </span>
              </Show>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-1 min-h-0">
          <Show
            when={messages().length > 0}
            fallback={
              <div class="text-text-muted text-sm p-3 text-center">
                No messages from this user in this channel yet.
              </div>
            }
          >
            <For each={messages()}>
              {(m) => (
                <div class="px-2 py-1 hover:bg-bg-light/30 rounded text-base leading-snug">
                  <Show when={m.reply}>
                    <div class="text-text-muted/70 truncate text-xs">
                      <span>⌐ Replying to </span>
                      <span class="font-semibold text-primary">
                        @{m.reply!.parent_user_name}
                      </span>
                      <span>: {m.reply!.parent_message_body}</span>
                    </div>
                  </Show>
                  <div class="flex gap-2">
                    <span class="text-text-muted tabular-nums shrink-0">
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>
                    <span class="text-text wrap-break-word min-w-0">
                      {visibleText(m)}
                    </span>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </Portal>
  );
}
