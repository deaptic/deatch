import { createSignal, createMemo, createEffect, For, Show, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { getUsers, type User } from "../../commands/users";
import { feeds } from "../feed/feeds";
import type { FeedMessage } from "../feed/types";

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
  let suppressNextClick = false;

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
    let moved = false;
    const onMove = (ev: MouseEvent) => {
      moved = true;
      const w = cardRef?.offsetWidth ?? CARD_W;
      const h = cardRef?.offsetHeight ?? CARD_MAX_H;
      setPos({
        x: Math.max(8, Math.min(ev.clientX - offsetX, window.innerWidth - w - 8)),
        y: Math.max(8, Math.min(ev.clientY - offsetY, window.innerHeight - h - 8)),
      });
    };
    const onUp = () => {
      if (moved) suppressNextClick = true;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const close = (e: Event) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    if (cardRef?.contains(e.target as Node)) return;
    props.onClose();
  };
  document.addEventListener("click", close, { capture: true });
  document.addEventListener("contextmenu", close, { capture: true });
  onCleanup(() => {
    document.removeEventListener("click", close, { capture: true });
    document.removeEventListener("contextmenu", close, { capture: true });
  });

  const messages = createMemo<FeedMessage[]>(() => {
    const feed = feeds[props.broadcasterId];
    if (!feed) return [];
    return feed.messages.filter(
      (m): m is FeedMessage => m.kind === "message" && m.chatter_user_id === props.chatterId,
    );
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <Portal>
      <div
        ref={cardRef}
        class="fixed z-50 bg-bg border border-border-muted rounded-lg shadow-2xl overflow-hidden flex flex-col"
        style={{
          top: `${pos().y}px`,
          left: `${pos().x}px`,
          width: `${CARD_W}px`,
          "max-height": `${CARD_MAX_H}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
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
          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <div class="flex items-baseline justify-between gap-2">
              <span class="font-semibold text-text truncate">
                {user()?.display_name ?? props.chatterId}
              </span>
              <span class="text-text-muted text-xs shrink-0 tabular-nums">
                ID: {props.chatterId}
              </span>
            </div>
            <Show when={user() && user()!.login !== user()!.display_name.toLowerCase()}>
              <div class="text-text-muted text-xs truncate">{user()!.login}</div>
            </Show>
            <Show when={user()?.created_at}>
              <div class="text-text-muted text-xs mt-1">
                Created: {formatDate(user()!.created_at)}
              </div>
            </Show>
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
                <div class="flex gap-2 px-2 py-1 hover:bg-bg-light/30 rounded text-base leading-snug">
                  <span class="text-text-muted tabular-nums shrink-0 select-none">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                  <span class="text-text wrap-break-word min-w-0">
                    {m.fragments.map((f) => f.text).join("")}
                  </span>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </Portal>
  );
}
