import { Search } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { captureFocusForRestore } from "../../lib/utils/focus.ts";
import * as users from "../../lib/services/users.ts";
import {
  channelsInOrder,
  rememberUser,
  streamForUserId,
} from "../../lib/stores/channels.ts";
import { pinChannel, pinnedChannels } from "../../lib/stores/preferences.ts";
import { watchWarmedChannels } from "../../lib/stores/watch.ts";
import { user } from "../../lib/stores/users.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { errorMessage } from "../../lib/utils/error.ts";
import { formatViewers } from "../../lib/format/stream.ts";
import type { User } from "../../lib/types/index.ts";
import Avatar from "../ui/Avatar.tsx";
import Field from "../ui/Field.tsx";
import Loading from "../ui/Loading.tsx";

type Props = {
  onSelect: (ch: User) => void;
  onClose: () => void;
};

type Row =
  | { kind: "channel"; user: User }
  | { kind: "search"; query: string };

const KBD =
  "min-w-5.5 h-5 px-1.5 inline-grid place-items-center rounded-xs bg-raised text-micro text-ink-faint font-sans";

function candidates(): User[] {
  const seen = new Set<string>();
  const out: User[] = [];
  const push = (u: User | null | undefined) => {
    if (!u || seen.has(u.id)) return;
    seen.add(u.id);
    out.push(u);
  };
  for (const u of channelsInOrder()) push(u);
  for (const u of watchWarmedChannels()) push(u);
  push(user());
  return out;
}

function matches(u: User, q: string): boolean {
  return u.login.includes(q) || u.displayName.toLowerCase().includes(q);
}

export default function QuickSwitch(props: Props) {
  captureFocusForRestore();
  const [query, setQuery] = createSignal("");
  const [active, setActive] = createSignal(0);
  const [searching, setSearching] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  const rows = createMemo<Row[]>(() => {
    const q = query().trim().toLowerCase();
    const list = candidates().filter((u) => !q || matches(u, q));
    const out: Row[] = list.map((user) => ({ kind: "channel", user }));
    if (q && !list.some((u) => u.login === q)) {
      out.push({ kind: "search", query: q });
    }
    return out;
  });

  createEffect(() => {
    rows();
    setActive(0);
  });

  createEffect(() => {
    const idx = active();
    queueMicrotask(() => {
      document
        .querySelector<HTMLElement>(`[data-switch-index="${idx}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  });

  function move(delta: number) {
    const n = rows().length;
    if (n === 0) return;
    setActive((i) => (i + delta + n) % n);
  }

  async function open(row: Row, pin: boolean) {
    if (row.kind === "channel") {
      if (pin && pinChannel(row.user.id)) {
        addToast(`Pinned ${row.user.displayName}`, "success");
      }
      props.onSelect(row.user);
      props.onClose();
      return;
    }
    setSearching(true);
    try {
      const found = (await users.get({ logins: [row.query] }))[0];
      if (!found) {
        addToast("No channel with that name", "error");
        return;
      }
      rememberUser(found);
      if (pin) pinChannel(found.id);
      props.onSelect(found);
      props.onClose();
    } catch (e) {
      addToast(errorMessage(e), "error");
    } finally {
      setSearching(false);
    }
  }

  onMount(() => {
    queueMicrotask(() => inputRef?.focus());
    const unbind = shortcuts.bindScope("quickSwitchOpen", {
      up: () => move(-1),
      down: () => move(1),
      enter: () => {
        const row = rows()[active()];
        if (row) void open(row, false);
      },
      "ctrl-enter": () => {
        const row = rows()[active()];
        if (row) void open(row, true);
      },
    });
    onCleanup(unbind);
  });

  return (
    <Portal>
      <div
        class="fixed inset-0 z-50 flex items-start justify-center px-4 pt-40 bg-scrim"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) props.onClose();
        }}
      >
        <div
          role="dialog"
          aria-label="Quick switch"
          class="w-140 max-w-full max-h-3/5 flex flex-col bg-overlay border border-line rounded-lg p-2.5 transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
        >
          <Field
            size="lg"
            icon={<Search />}
            ref={(el) => (inputRef = el)}
            placeholder="Jump to a channel…"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            trailing={<kbd class={KBD}>Esc</kbd>}
          />
          <div class="flex-1 min-h-0 overflow-y-auto mt-2 flex flex-col gap-0.5">
            <Show
              when={rows().length > 0}
              fallback={
                <p class="py-8 text-center text-body text-ink-soft">
                  Nothing matches. Type a channel name to search Twitch.
                </p>
              }
            >
              <For each={rows()}>
                {(row, i) => (
                  <button
                    type="button"
                    data-switch-index={i()}
                    onMouseMove={() => setActive(i())}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => void open(row, e.ctrlKey)}
                    class={`flex items-center gap-3 h-13 px-2.5 rounded-sm text-left cursor-pointer transition-colors duration-snap ${
                      active() === i() ? "bg-raised" : "hover:bg-raised"
                    }`}
                  >
                    <Show
                      when={row.kind === "channel" ? row : null}
                      fallback={
                        <>
                          <span class="size-8 rounded-full bg-raised grid place-items-center text-ink-soft">
                            <Show
                              when={!searching()}
                              fallback={<Loading size={16} />}
                            >
                              <Search class="size-4" />
                            </Show>
                          </span>
                          <span class="flex-1 min-w-0 flex flex-col">
                            <span class="text-body font-semibold text-ink truncate">
                              Search Twitch for “{query().trim()}”
                            </span>
                            <span class="text-small text-ink-soft">
                              Not in your rail yet
                            </span>
                          </span>
                        </>
                      }
                    >
                      {(r) => {
                        const stream = () => streamForUserId(r().user.id);
                        return (
                          <>
                            <Avatar
                              src={r().user.profileImageUrl}
                              alt={r().user.displayName}
                              size={32}
                              presence={stream() ? "live" : "offline"}
                            />
                            <span class="flex-1 min-w-0 flex flex-col">
                              <span class="text-body font-semibold text-ink truncate">
                                {r().user.displayName}
                              </span>
                              <span
                                class={`text-small truncate ${
                                  stream() ? "text-live" : "text-ink-soft"
                                }`}
                              >
                                <Show when={stream()} fallback="Offline">
                                  Live · {stream()!.game.name} ·{" "}
                                  {formatViewers(stream()!.viewerCount)}
                                </Show>
                                <Show
                                  when={pinnedChannels().includes(r().user.id)}
                                >
                                  {" · pinned"}
                                </Show>
                              </span>
                            </span>
                          </>
                        );
                      }}
                    </Show>
                    <Show when={active() === i()}>
                      <kbd class={KBD}>↵</kbd>
                    </Show>
                  </button>
                )}
              </For>
            </Show>
          </div>
          <div class="flex items-center gap-4 pt-2.5 mt-2 px-1 border-t border-line-soft text-small text-ink-faint">
            <span class="flex items-center gap-1.5">
              <kbd class={KBD}>↑↓</kbd> move
            </span>
            <span class="flex items-center gap-1.5">
              <kbd class={KBD}>↵</kbd> open
            </span>
            <span class="flex items-center gap-1.5">
              <kbd class={KBD}>Ctrl ↵</kbd> open and pin
            </span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
