import { createSignal, createMemo, createEffect, For, Show, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { getUsers, type User } from "../../commands/users";
import { feeds } from "../feed/feeds";
import type { FeedMessage } from "../feed/types";
import CloseIcon from "../../icons/CloseIcon";

type Props = {
  x: number;
  y: number;
  chatterId: string;
  broadcasterId: string;
  onClose: () => void;
};

const CARD_W = 384;
const CARD_MAX_H = 480;

export default function UserCard(props: Props) {
  const [user, setUser] = createSignal<User | null>(null);
  let cardRef: HTMLDivElement | undefined;

  const [pos, setPos] = createSignal({
    x: Math.max(8, Math.min(props.x, window.innerWidth - CARD_W - 8)),
    y: props.y,
  });

  createEffect(() => {
    const id = props.chatterId;
    setUser(null);
    getUsers({ userIds: [id] })
      .then((users) => setUser(users[0] ?? null))
      .catch(() => {});
  });

  onMount(() => {
    if (cardRef) {
      const rect = cardRef.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 8) {
        setPos((p) => ({ ...p, y: Math.max(8, window.innerHeight - rect.height - 8) }));
      }
    }
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
      setPos({
        x: Math.max(8, Math.min(ev.clientX - offsetX, window.innerWidth - w - 8)),
        y: Math.max(8, Math.min(ev.clientY - offsetY, window.innerHeight - h - 8)),
      });
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
      (m): m is FeedMessage => m.kind === "message" && m.chatter_user_id === props.chatterId,
    );
  });

  const formatJoinDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  function visibleText(m: FeedMessage): string {
    if (!m.reply) return m.fragments.map((f) => f.text).join("");
    const [first, ...rest] = m.fragments;
    if (first?.type === "mention" && first.user_login === m.reply.parent_user_login) {
      if (rest[0]?.type === "text") {
        const trimmed = rest[0].text.trimStart();
        const remaining = trimmed ? [{ ...rest[0], text: trimmed }, ...rest.slice(1)] : rest.slice(1);
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
        style={{ top: `${pos().y}px`, left: `${pos().x}px` }}
      >
        <div
          class="flex gap-3 p-3 border-b border-border-muted cursor-move select-none"
          onMouseDown={startDrag}
        >
          <img
            src={user()?.profile_image_url || ""}
            alt={user()?.display_name ?? ""}
            class="w-16 h-16 rounded-lg shrink-0 bg-bg-light"
          />
          <div class="flex-1 min-w-0 flex flex-col">
            <span class="font-semibold text-text text-lg leading-tight truncate">
              {user()?.display_name ?? props.chatterId}
            </span>
            <Show when={user()}>
              <span class="text-text-muted/70 text-sm truncate">@{user()!.login}</span>
            </Show>
            <div class="text-text-muted text-xs mt-1.5 truncate flex items-center gap-1.5">
              <Show when={user()?.created_at}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3 h-3 shrink-0">
                  <rect x="2" y="3" width="12" height="11" rx="1" />
                  <path d="M2 6h12 M5 1.5v3 M11 1.5v3" stroke-linecap="round" />
                </svg>
                <span>{formatJoinDate(user()!.created_at)}</span>
                <span class="opacity-50">·</span>
              </Show>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3 h-3 shrink-0">
                <path d="M5 2v12 M11 2v12 M2 5h12 M2 11h12" stroke-linecap="round" />
              </svg>
              <span class="tabular-nums">{props.chatterId}</span>
            </div>
          </div>
          <button
            class="shrink-0 self-start text-text-muted hover:text-text p-1 cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={props.onClose}
            title="Close"
            aria-label="Close"
          >
            <CloseIcon class="w-3 h-3" />
          </button>
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
                    <span class="text-text-muted tabular-nums shrink-0 select-none">
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
